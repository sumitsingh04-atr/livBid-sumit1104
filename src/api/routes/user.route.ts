import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/me', authenticate as any, userController.me as any);

export default router;
