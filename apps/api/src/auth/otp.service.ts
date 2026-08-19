import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  /** Generate a 6-digit OTP (crypto-random). */
  generate(): string {
    const buf = crypto.randomInt(0, 1_000_000);
    return buf.toString().padStart(6, '0');
  }

  /** Hash an OTP for storage (sha256 + salt) — never store raw. */
  hash(otp: string, salt: string = 'sc-otp'): string {
    return crypto.createHash('sha256').update(`${salt}:${otp}`).digest('hex');
  }

  verify(otp: string, hash: string, salt: string = 'sc-otp'): boolean {
    return this.hash(otp, salt) === hash;
  }

  /** OTP valid window: 10 minutes. */
  isExpired(expiresOn: Date): boolean {
    return expiresOn.getTime() < Date.now();
  }
}
