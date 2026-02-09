import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
declare class AuctionController {
    create(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    list(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    bid(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
declare const _default: AuctionController;
export default _default;
//# sourceMappingURL=auction.controller.d.ts.map