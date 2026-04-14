import { Request, Response, NextFunction } from 'express';
export interface AuthPayload {
    userId: string;
    role: string;
    phone: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
export declare function requireRole(...roles: string[]): (req: Request, res: Response, next: NextFunction) => void;
export declare function signToken(payload: AuthPayload): string;
//# sourceMappingURL=auth.d.ts.map