"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../../../winston/logger"));
const package_helper_1 = require("../../../helper/package.helper");
const secret = process.env.JWT_ACCESS_SECRET || 'your_secret';
class SocketService {
    constructor() {
        this.io = null;
        this.viewerCounts = new Map();
    }
    init(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: '*',
            }
        });
        // Middleware for authentication
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.headers.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            try {
                const decoded = jsonwebtoken_1.default.verify(token, secret);
                socket.userId = decoded.id;
                next();
            }
            catch (err) {
                return next(new Error('Authentication error: Invalid token'));
            }
        });
        this.io.on('connection', (socket) => {
            logger_1.default.info(`User connected: ${socket.id}`);
            socket.on('joinAuction', async (auctionId) => {
                const room = `auction:${auctionId}`;
                socket.join(room);
                const currentCount = this.viewerCounts.get(room) || 0;
                this.viewerCounts.set(room, currentCount + 1);
                this.io?.to(room).emit('VIEWER_COUNT', {
                    auctionId,
                    count: this.viewerCounts.get(room)
                });
                // Send current auction state to the client that just joined
                try {
                    const auction = await package_helper_1.DB.auctionItem.findUnique({
                        where: { id: parseInt(auctionId) },
                        include: {
                            bids: {
                                take: 1,
                                orderBy: { createdAt: 'desc' },
                                include: {
                                    bidder: {
                                        select: { email: true }
                                    }
                                }
                            }
                        }
                    });
                    if (auction) {
                        socket.emit('AUCTION_STATE', {
                            auctionId: auction.id,
                            currentPrice: auction.currentPrice,
                            endsAt: auction.endsAt,
                            status: auction.status,
                            lastBid: auction.bids[0] ? {
                                amount: auction.bids[0].amount,
                                bidderName: auction.bids[0].bidder.email,
                                timestamp: auction.bids[0].createdAt
                            } : null
                        });
                    }
                }
                catch (error) {
                    logger_1.default.error(`Error fetching auction state on join: ${error}`);
                }
                logger_1.default.info(`User ${socket.id} joined ${room}. Count: ${this.viewerCounts.get(room)}`);
            });
            socket.on('leaveAuction', (auctionId) => {
                const room = `auction:${auctionId}`;
                socket.leave(room);
                this.decrementViewerCount(room, auctionId);
            });
            socket.on('disconnecting', () => {
                socket.rooms.forEach(room => {
                    if (room.startsWith('auction:')) {
                        const auctionId = room.split(':')[1];
                        if (auctionId) {
                            this.decrementViewerCount(room, auctionId);
                        }
                    }
                });
            });
            socket.on('disconnect', () => {
                logger_1.default.info(`User disconnected: ${socket.id}`);
            });
        });
    }
    decrementViewerCount(room, auctionId) {
        const currentCount = this.viewerCounts.get(room) || 0;
        const newCount = Math.max(0, currentCount - 1);
        this.viewerCounts.set(room, newCount);
        this.io?.to(room).emit('VIEWER_COUNT', { auctionId, count: newCount });
    }
    emitToAuction(auctionId, event, payload) {
        if (this.io) {
            this.io.to(`auction:${auctionId}`).emit(event, payload);
        }
    }
}
exports.default = new SocketService();
//# sourceMappingURL=socket.service.js.map