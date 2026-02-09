"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auction_service_1 = __importDefault(require("../services/auction.service"));
const socket_service_1 = __importDefault(require("../websocket/socket.service"));
const logger_1 = __importDefault(require("../../../winston/logger"));
class AuctionController {
    async create(req, res) {
        try {
            const auction = await auction_service_1.default.createAuction(req.body, req.user.id);
            return res.status(201).json({
                message: 'Auction created successfully',
                data: auction
            });
        }
        catch (error) {
            logger_1.default.error(`AuctionController.create error: ${error.message}`);
            return res.status(400).json({ message: error.message });
        }
    }
    async list(req, res) {
        try {
            const result = await auction_service_1.default.getAuctions(req.query);
            return res.status(200).json(result);
        }
        catch (error) {
            logger_1.default.error(`AuctionController.list error: ${error.message}`);
            return res.status(500).json({ message: error.message });
        }
    }
    async getById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ message: 'Invalid ID' });
            }
            const auction = await auction_service_1.default.getAuctionById(id);
            return res.status(200).json(auction);
        }
        catch (error) {
            logger_1.default.error(`AuctionController.getById error: ${error.message}`);
            return res.status(404).json({ message: error.message });
        }
    }
    async bid(req, res) {
        try {
            const auctionId = parseInt(req.params.id);
            const { amount } = req.body;
            const bidderId = req.user.id;
            if (isNaN(auctionId) || !amount) {
                return res.status(400).json({ message: 'Invalid auction ID or amount' });
            }
            const result = await auction_service_1.default.placeBid(auctionId, bidderId, amount);
            // Emit Socket event (NEW_BID) here after success
            socket_service_1.default.emitToAuction(auctionId, 'NEW_BID', {
                amount: result.bid.amount,
                bidderName: req.user.email, // Using email as name for now
                timestamp: result.bid.createdAt
            });
            return res.status(201).json({
                message: 'Bid placed successfully',
                data: result
            });
        }
        catch (error) {
            logger_1.default.error(`AuctionController.bid error: ${error.message}`);
            return res.status(400).json({ message: error.message });
        }
    }
}
exports.default = new AuctionController();
//# sourceMappingURL=auction.controller.js.map