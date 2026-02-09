import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../../../winston/logger';
import { DB } from '../../../helper/package.helper';

const secret = process.env.JWT_ACCESS_SECRET || 'your_secret';

class SocketService {
    private io: Server | null = null;
    private viewerCounts: Map<string, number> = new Map();

    public init(server: any) {
        this.io = new Server(server, {
            cors: {
                origin: '*',
            }
        });

        // Middleware for authentication
        this.io.use((socket: Socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.headers.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            try {
                const decoded: any = jwt.verify(token, secret);
                (socket as any).userId = decoded.id;
                next();
            } catch (err) {
                return next(new Error('Authentication error: Invalid token'));
            }
        });

        this.io.on('connection', (socket: Socket) => {
            logger.info(`User connected: ${socket.id}`);

            socket.on('joinAuction', async (auctionId: string) => {
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
                    const auction = await DB.auctionItem.findUnique({
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
                } catch (error) {
                    logger.error(`Error fetching auction state on join: ${error}`);
                }

                logger.info(`User ${socket.id} joined ${room}. Count: ${this.viewerCounts.get(room)}`);
            });

            socket.on('leaveAuction', (auctionId: string) => {
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
                logger.info(`User disconnected: ${socket.id}`);
            });
        });
    }

    private decrementViewerCount(room: string, auctionId: string) {
        const currentCount = this.viewerCounts.get(room) || 0;
        const newCount = Math.max(0, currentCount - 1);
        this.viewerCounts.set(room, newCount);
        this.io?.to(room).emit('VIEWER_COUNT', { auctionId, count: newCount });
    }

    public emitToAuction(auctionId: string | number, event: string, payload: any) {
        if (this.io) {
            this.io.to(`auction:${auctionId}`).emit(event, payload);
        }
    }
}

export default new SocketService();
