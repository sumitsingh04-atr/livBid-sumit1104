"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auctionWorker = exports.auctionQueue = void 0;
const bullmq_1 = require("bullmq");
const package_helper_1 = require("../../../helper/package.helper");
const socket_service_1 = __importDefault(require("../websocket/socket.service"));
const logger_1 = __importDefault(require("../../../winston/logger"));
const ioredis_1 = __importDefault(require("ioredis"));
const redisConnection = new ioredis_1.default({
    host: process.env.REDIS_HOSTNAME || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    ...(process.env.REDIS_AUTH ? { password: process.env.REDIS_AUTH } : {}),
    maxRetriesPerRequest: null,
});
exports.auctionQueue = new bullmq_1.Queue('auctionQueue', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: {
            age: 3600, // keep up to 1 hour
            count: 1000, // keep up to 1000 jobs
        },
        removeOnFail: {
            age: 24 * 3600, // keep up to 24 hours
        }
    }
});
exports.auctionWorker = new bullmq_1.Worker('auctionQueue', async (job) => {
    const { type, auctionId, bidderId, bidderEmail, amount } = job.data;
    try {
        switch (type) {
            case 'AUCTION_SETTLEMENT':
                await handleSettlement(auctionId);
                break;
            case 'OUTBID_NOTIFICATION':
                logger_1.default.info(`NOTIFY: User ${bidderEmail} was outbid on auction ${auctionId}. New bid: ${amount}`);
                break;
            case 'AUCTION_REMINDER':
                socket_service_1.default.emitToAuction(auctionId, 'AUCTION_ENDING_SOON', {
                    auctionId,
                    secondsRemaining: 300 // 5 minutes
                });
                break;
            case 'SETTLEMENT_CLEANUP':
                await runSettlementCleanup();
                break;
        }
    }
    catch (error) {
        logger_1.default.error(`Worker error for job ${job.id} (${type}): ${error.message}`);
        throw error;
    }
}, {
    connection: redisConnection,
    concurrency: 5
});
async function handleSettlement(auctionId) {
    await package_helper_1.DB.$transaction(async (tx) => {
        // Use FOR UPDATE to prevent concurrent settlement of the same auction
        const auctionResult = await tx.$queryRaw `
            SELECT id, status, "creatorId", "winnerId", "currentPrice" 
            FROM auction_items 
            WHERE id = ${auctionId} 
            FOR UPDATE
        `;
        if (auctionResult.length === 0)
            return;
        const auction = auctionResult[0];
        // Idempotency check: only settle if ACTIVE
        if (auction.status !== 'ACTIVE') {
            logger_1.default.info(`Auction ${auctionId} already settled or not active (status: ${auction.status})`);
            return;
        }
        if (auction.winnerId) {
            // Transfer funds to creator
            await tx.user.update({
                where: { id: auction.creatorId },
                data: {
                    balance: { increment: auction.currentPrice }
                }
            });
            await tx.auctionItem.update({
                where: { id: auctionId },
                data: { status: 'SOLD' }
            });
            const winner = await tx.user.findUnique({ where: { id: auction.winnerId } });
            socket_service_1.default.emitToAuction(auctionId, 'AUCTION_SOLD', {
                auctionId,
                winnerName: winner?.email,
                finalPrice: auction.currentPrice
            });
            logger_1.default.info(`Auction ${auctionId} settled: SOLD to user ${auction.winnerId}`);
        }
        else {
            await tx.auctionItem.update({
                where: { id: auctionId },
                data: { status: 'EXPIRED' }
            });
            socket_service_1.default.emitToAuction(auctionId, 'AUCTION_EXPIRED', { auctionId });
            logger_1.default.info(`Auction ${auctionId} settled: EXPIRED (no bids)`);
        }
    });
}
async function runSettlementCleanup() {
    logger_1.default.info('Running periodic settlement cleanup...');
    const expiredAuctions = await package_helper_1.DB.auctionItem.findMany({
        where: {
            status: 'ACTIVE',
            endsAt: { lte: new Date() }
        }
    });
    for (const auction of expiredAuctions) {
        logger_1.default.warn(`Found missed settlement for auction ${auction.id}, queueing now.`);
        await exports.auctionQueue.add('AUCTION_SETTLEMENT', { type: 'AUCTION_SETTLEMENT', auctionId: auction.id }, { jobId: `settlement_cleanup_${auction.id}` });
    }
}
// Setup repeatable job for cleanup
exports.auctionQueue.add('SETTLEMENT_CLEANUP', { type: 'SETTLEMENT_CLEANUP' }, {
    repeat: { pattern: '*/1 * * * *' } // Every minute
});
exports.auctionWorker.on('completed', (job) => {
    logger_1.default.info(`Job ${job.id} of type ${job.name} completed`);
});
exports.auctionWorker.on('failed', (job, err) => {
    logger_1.default.error(`Job ${job?.id} of type ${job?.name} failed: ${err.message}`);
});
// Graceful shutdown
const shutdown = async () => {
    logger_1.default.info('Gracefully shutting down auction worker...');
    await exports.auctionWorker.close();
    await redisConnection.quit();
    process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
//# sourceMappingURL=auction.worker.js.map