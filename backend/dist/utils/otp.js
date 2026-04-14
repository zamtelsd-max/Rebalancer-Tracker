"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOTP = generateOTP;
exports.storeOTP = storeOTP;
exports.verifyOTP = verifyOTP;
// In-memory OTP store (replace with Redis in production)
const otpStore = new Map();
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
function storeOTP(requestId, otp, ttlSeconds = 300) {
    otpStore.set(requestId, {
        otp,
        expiresAt: Date.now() + ttlSeconds * 1000,
    });
}
function verifyOTP(requestId, otp) {
    const entry = otpStore.get(requestId);
    if (!entry)
        return false;
    if (Date.now() > entry.expiresAt) {
        otpStore.delete(requestId);
        return false;
    }
    if (entry.otp !== otp)
        return false;
    otpStore.delete(requestId);
    return true;
}
//# sourceMappingURL=otp.js.map