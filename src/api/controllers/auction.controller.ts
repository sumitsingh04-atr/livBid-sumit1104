import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import auctionService from '../services/auction.service';
import socketService from '../websocket/socket.service';
import logger from '../../../winston/logger';

class AuctionController {
    public async create(req: AuthRequest, res: Response) {
        try {
            const auction = await auctionService.createAuction(req.body, req.user.id);
            return res.status(201).json({
                message: 'Auction created successfully',
                data: auction
            });
        } catch (error: any) {
            logger.error(`AuctionController.create error: ${error.message}`);
            return res.status(400).json({ message: error.message });
        }
    }

    public async list(req: AuthRequest, res: Response) {
        try {
            const result = await auctionService.getAuctions(req.query);
            return res.status(200).json(result);
        } catch (error: any) {
            logger.error(`AuctionController.list error: ${error.message}`);
            return res.status(500).json({ message: error.message });
        }
    }

    public async getById(req: AuthRequest, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            if (isNaN(id)) {
                return res.status(400).json({ message: 'Invalid ID' });
            }
            const auction = await auctionService.getAuctionById(id);
            return res.status(200).json(auction);
        } catch (error: any) {
            logger.error(`AuctionController.getById error: ${error.message}`);
            return res.status(404).json({ message: error.message });
        }
    }

    public async bid(req: AuthRequest, res: Response) {
        try {
            const auctionId = parseInt(req.params.id as string);
            const { amount } = req.body;
            const bidderId = req.user.id;

            if (isNaN(auctionId) || !amount) {
                return res.status(400).json({ message: 'Invalid auction ID or amount' });
            }

            const result = await auctionService.placeBid(auctionId, bidderId, amount);

            // Emit Socket event (NEW_BID) here after success
            socketService.emitToAuction(auctionId, 'NEW_BID', {
                amount: result.bid.amount,
                bidderName: req.user.email, // Using email as name for now
                timestamp: result.bid.createdAt
            });

            return res.status(201).json({
                message: 'Bid placed successfully',
                data: result
            });
        } catch (error: any) {
            logger.error(`AuctionController.bid error: ${error.message}`);
            return res.status(400).json({ message: error.message });
        }
    }
}

export default new AuctionController();
