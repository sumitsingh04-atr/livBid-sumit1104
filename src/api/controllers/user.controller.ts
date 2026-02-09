import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import userService from '../services/user.service';
import logger from '../../../winston/logger';

class UserController {
    public async me(req: AuthRequest, res: Response) {
        try {
            const userId = req.user.id;
            const profile = await userService.getUserProfile(userId);
            return res.status(200).json(profile);
        } catch (error: any) {
            logger.error(`UserController.me error: ${error.message}`);
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new UserController();
