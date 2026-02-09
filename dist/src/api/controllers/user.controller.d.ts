import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
declare class UserController {
    me(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=user.controller.d.ts.map