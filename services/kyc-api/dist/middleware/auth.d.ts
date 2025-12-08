import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        walletAddress: string;
        isAdmin?: boolean;
    };
}
export declare function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function generateToken(walletAddress: string, isAdmin?: boolean): string;
export declare function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map