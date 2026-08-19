import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { TenantDbService } from '../tenancy/tenant-db.service';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    private tenantDb: TenantDbService,
    private otp: OtpService,
    private jwt: JwtService,
  ) {}

  /** Request OTP for a phone/email within a tenant schema. */
  async requestOtp(tenantDbName: string, phone?: string, email?: string) {
    if (!phone && !email) throw new BadRequestException('phone or email is required');
    const db = this.tenantDb.getDb(tenantDbName);
    const otp = this.otp.generate();
    const expiresOn = new Date(Date.now() + 10 * 60 * 1000);

    const { rows } = await db.query(
      `INSERT INTO "OtpRequests" ("Phone","Email","OtpHash","ExpiresOn") VALUES ($1,$2,$3,$4) RETURNING "RequestId"`,
      [phone ?? null, email ?? null, this.otp.hash(otp), expiresOn],
    );

    // DEV mode: log OTP (production: WhatsApp bridge / SendGrid)
    console.log(`[OTP DEV] ${phone || email}: ${otp}`);
    return { requestId: rows[0].RequestId, devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined };
  }

  /** Verify OTP → find-or-create user → return JWT (scoped to tenant). */
  async verifyOtp(tenantDbName: string, requestId: string, otp: string, phone?: string, email?: string) {
    const db = this.tenantDb.getDb(tenantDbName);
    const { rows } = await db.query(
      `SELECT * FROM "OtpRequests" WHERE "RequestId" = $1 AND "Verified" = FALSE ORDER BY "CreatedOn" DESC LIMIT 1`,
      [requestId],
    );
    const req = rows[0];
    if (!req) throw new UnauthorizedException('Invalid request id');
    if (this.otp.isExpired(req.ExpiresOn)) throw new UnauthorizedException('OTP expired');
    if (!this.otp.verify(otp, req.OtpHash)) throw new UnauthorizedException('Invalid OTP');

    await db.query(`UPDATE "OtpRequests" SET "Verified" = TRUE WHERE "RequestId" = $1`, [requestId]);

    // find-or-create user
    const contact = phone || email;
    const col = phone ? 'Phone' : 'Email';
    const { rows: users } = await db.query(
      `SELECT * FROM "Users" WHERE "${col}" = $1`,
      [contact],
    );
    let user = users[0];
    if (!user) {
      const { rows: created } = await db.query(
        `INSERT INTO "Users" ("${col}","FirstName") VALUES ($1,$2) RETURNING *`,
        [contact, 'User'],
      );
      user = created[0];
    }

    const token = await this.jwt.signAsync({
      sub: user.UserId,
      tenant: tenantDbName,
      role: 'customer',
    });
    return { access_token: token, user: { UserId: user.UserId, Phone: user.Phone, Email: user.Email } };
  }

  /** Admin login (platform + tenant admins) against the registry. */
  async adminLogin(userName: string, password: string) {
    const crypto2 = await import('bcrypt');
    const db = this.tenantDb.getDb(process.env.ADMIN_DATABASE_NAME || 'smartecommerce_admin');
    const { rows } = await db.query(`SELECT * FROM "AdminUsers" WHERE "Phone" = $1 OR "Email" = $1`, [userName]);
    const admin = rows[0];
    if (!admin || !admin.Password) throw new UnauthorizedException('Invalid credentials');
    const ok = await crypto2.compare(password, admin.Password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const token = await this.jwt.signAsync({
      sub: admin.UserId,
      tenant: admin.TenantId,
      role: admin.Role,
    });
    return { access_token: token, user: { UserId: admin.UserId, Role: admin.Role } };
  }
}
