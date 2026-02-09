"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const package_helper_1 = require("../../../helper/package.helper");
const auction_worker_1 = require("../workers/auction.worker");
const socket_service_1 = __importDefault(require("../websocket/socket.service"));
const logger_1 = __importDefault(require("../../../winston/logger"));
class AuctionService {
    async createAuction(data, creatorId) {
        try {
            const { title, description, startingPrice, endsAt } = data;
            if (new Date(endsAt) <= new Date()) {
                throw new Error('EndsAt must be in the future');
            }
            const auction = await package_helper_1.DB.auctionItem.create({
                data: {
                    title,
                    description,
                    startingPrice,
                    currentPrice: startingPrice,
                    endsAt: new Date(endsAt),
                    creatorId,
                    status: 'ACTIVE' // Default to ACTIVE for now as per usual auction flow
                }
            });
            // Schedule Settlement Job
            const delay = new Date(endsAt).getTime() - Date.now();
            await auction_worker_1.auctionQueue.add('AUCTION_SETTLEMENT', { type: 'AUCTION_SETTLEMENT', auctionId: auction.id }, {
                delay: Math.max(0, delay),
                jobId: `settlement_${auction.id}`,
                removeOnComplete: true
            });
            // Schedule Reminder (5 mins before)
            const reminderDelay = delay - (5 * 60 * 1000);
            if (reminderDelay > 0) {
                await auction_worker_1.auctionQueue.add('AUCTION_REMINDER', { type: 'AUCTION_REMINDER', auctionId: auction.id }, {
                    delay: reminderDelay,
                    jobId: `reminder_${auction.id}`,
                    removeOnComplete: true
                });
            }
            return auction;
        }
        catch (error) {
            logger_1.default.error(`AuctionService.createAuction error: ${error.message}`);
            throw error;
        }
    }
    async getAuctions(query) {
        try {
            const { status, page = 1, limit = 10 } = query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = {};
            if (status) {
                where.status = status;
            }
            const [auctions, total] = await Promise.all([
                package_helper_1.DB.auctionItem.findMany({
                    where,
                    skip,
                    take: Number(limit),
                    orderBy: { createdAt: 'desc' },
                    include: {
                        creator: {
                            select: { id: true, email: true }
                        }
                    }
                }),
                package_helper_1.DB.auctionItem.count({ where })
            ]);
            return {
                auctions,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            };
        }
        catch (error) {
            logger_1.default.error(`AuctionService.getAuctions error: ${error.message}`);
            throw error;
        }
    }
    async getAuctionById(id) {
        try {
            const auction = await package_helper_1.DB.auctionItem.findUnique({
                where: { id },
                include: {
                    creator: {
                        select: { id: true, email: true }
                    },
                    bids: {
                        take: 20,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            bidder: {
                                select: { id: true, email: true }
                            }
                        }
                    }
                }
            });
            if (!auction) {
                throw new Error('Auction not found');
            }
            return auction;
        }
        catch (error) {
            logger_1.default.error(`AuctionService.getAuctionById error: ${error.message}`);
            throw error;
        }
    }
    async placeBid(auctionId, bidderId, amount) {
        return await package_helper_1.DB.$transaction(async (tx) => {
            // 1. Acquire Pessimistic Lock on the Auction Item
            const auctionResult = await tx.$queryRaw `
                SELECT * FROM auction_items 
                WHERE id = ${auctionId} 
                FOR UPDATE
            `;
            if (auctionResult.length === 0) {
                throw new Error('Auction not found');
            }
            const auction = auctionResult[0];
            // 2. Acquire Pessimistic Lock on the Bidder to prevent negative balance
            // Locking the bidder ensures that concurrent bids from the same user across different 
            // auctions are serialized, preventing the balance from going negative.
            const bidderResult = await tx.$queryRaw `
                SELECT * FROM users WHERE id = ${bidderId} FOR UPDATE
            `;
            if (bidderResult.length === 0) {
                throw new Error('Bidder not found');
            }
            const bidder = bidderResult[0];
            // 3. Temporal Validation (Inside the lock)
            if (auction.status.toUpperCase() !== 'ACTIVE' || new Date(auction.endsAt) <= new Date()) {
                throw new Error('Auction is not active or has expired');
            }
            // 4. Bid Amount Validation
            if (Number(amount) <= Number(auction.currentPrice)) {
                throw new Error('Bid must be higher than current price');
            }
            // 5. Bidder Balance Check (Inside the lock)
            if (Number(bidder.balance) < Number(amount)) {
                throw new Error('Insufficient balance');
            }
            // 6. Balance Escrow Logic
            // Refund the previous winner if exists
            if (auction.winnerId) {
                await tx.user.update({
                    where: { id: auction.winnerId },
                    data: {
                        balance: { increment: auction.currentPrice }
                    }
                });
            }
            // Deduct from the new bidder
            await tx.user.update({
                where: { id: bidderId },
                data: {
                    balance: { decrement: amount }
                }
            });
            // 7. Anti-Sniping Bonus
            let updatedEndsAt = new Date(auction.endsAt);
            const tenSecondsFromNow = new Date(Date.now() + 10000);
            if (updatedEndsAt <= tenSecondsFromNow) {
                updatedEndsAt = new Date(updatedEndsAt.getTime() + 30000); // Extend by 30 seconds
            }
            // 8. Update Auction Item
            const updatedAuction = await tx.auctionItem.update({
                where: { id: auctionId },
                data: {
                    currentPrice: amount,
                    winnerId: bidderId,
                    endsAt: updatedEndsAt
                }
            });
            // 9. Create Bid Record
            const bid = await tx.bid.create({
                data: {
                    amount,
                    bidderId,
                    auctionItemId: auctionId
                }
            });
            // Schedule Outbid Notification if there was a previous winner
            if (auction.winnerId) {
                const previousWinner = await tx.user.findUnique({
                    where: { id: auction.winnerId }
                });
                if (previousWinner) {
                    await auction_worker_1.auctionQueue.add('OUTBID_NOTIFICATION', {
                        type: 'OUTBID_NOTIFICATION',
                        auctionId: auctionId,
                        bidderId: previousWinner.id,
                        bidderEmail: previousWinner.email,
                        amount: amount
                    }, {
                        removeOnComplete: true,
                        attempts: 3
                    });
                }
            }
            // If Anti-Sniping extended the time, we need to reschedule the settlement job
            if (updatedEndsAt.getTime() !== new Date(auction.endsAt).getTime()) {
                const newDelay = updatedEndsAt.getTime() - Date.now();
                await auction_worker_1.auctionQueue.add('AUCTION_SETTLEMENT', { type: 'AUCTION_SETTLEMENT', auctionId: auctionId }, { delay: newDelay, jobId: `settlement_${auctionId}`, removeOnComplete: true });
            }
            const result = { bid, updatedAuction };
            // Emit NEW_BID event after transaction commit
            socket_service_1.default.emitToAuction(auctionId, 'NEW_BID', {
                amount: amount,
                bidderName: bidder.email,
                timestamp: bid.createdAt
            });
            return result;
        });
    }
}
exports.default = new AuctionService();
//# sourceMappingURL=auction.service.js.map