// In-memory OTP store (replace with Redis in production)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(requestId: string, otp: string, ttlSeconds: number = 300): void {
  otpStore.set(requestId, {
    otp,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function verifyOTP(requestId: string, otp: string): boolean {
  const entry = otpStore.get(requestId);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(requestId);
    return false;
  }
  if (entry.otp !== otp) return false;
  otpStore.delete(requestId);
  return true;
}
