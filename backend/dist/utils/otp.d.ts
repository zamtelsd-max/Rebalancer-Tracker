export declare function generateOTP(): string;
export declare function storeOTP(requestId: string, otp: string, ttlSeconds?: number): void;
export declare function verifyOTP(requestId: string, otp: string): boolean;
//# sourceMappingURL=otp.d.ts.map