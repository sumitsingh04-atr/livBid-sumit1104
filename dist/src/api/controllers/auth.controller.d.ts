import { Request, Response } from 'express';
declare class AuthController {
    register(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    login(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: AuthController;
export default _default;
//# sourceMappingURL=auth.controller.d.ts.map