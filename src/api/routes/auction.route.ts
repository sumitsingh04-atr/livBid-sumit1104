import { Router } from 'express';
import auctionController from '../controllers/auction.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate as any, auctionController.create as any);
router.get('/', auctionController.list as any);
router.get('/:id', auctionController.getById as any);
router.post('/:id/bid', authenticate as any, auctionController.bid as any);

export default router;
