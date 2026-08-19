import { OtpService } from '../src/auth/otp.service';

describe('OtpService', () => {
  const otp = new OtpService();

  it('generates a 6-digit OTP', () => {
    const code = otp.generate();
    expect(code).toMatch(/^\d{6}$/);
  });

  it('generates distinct OTPs', () => {
    const codes = new Set(Array.from({ length: 50 }, () => otp.generate()));
    expect(codes.size).toBeGreaterThan(1);
  });

  it('hash is not reversible to the raw otp', () => {
    const h = otp.hash('123456');
    expect(h).not.toContain('123456');
    expect(h).toHaveLength(64);
  });

  it('verify matches correct otp and rejects wrong', () => {
    const h = otp.hash('123456');
    expect(otp.verify('123456', h)).toBe(true);
    expect(otp.verify('654321', h)).toBe(false);
  });

  it('detects expired otp', () => {
    expect(otp.isExpired(new Date(Date.now() - 1000))).toBe(true);
    expect(otp.isExpired(new Date(Date.now() + 60_000))).toBe(false);
  });
});
