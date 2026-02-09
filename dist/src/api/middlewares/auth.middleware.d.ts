import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: any;
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=auth.middleware.d.ts.map