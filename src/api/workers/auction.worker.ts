import { Worker, Queue } from 'bullmq';
import { DB } from '../../../helper/package.helper';
import socketService from '../websocket/socket.service';
import logger from '../../../winston/logger';
import IORedis from 'ioredis';

const redisConnection = new IORedis({
    host: process.env.REDIS_HOSTNAME || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    ...(process.env.REDIS_AUTH ? { password: process.env.REDIS_AUTH } : {}),
    maxRetriesPerRequest: null,
});

export const auctionQueue = new Queue('auctionQueue', {
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

export const auctionWorker = new Worker('auctionQueue', async (job) => {
    const { type, auctionId, bidderId, bidderEmail, amount } = job.data;

    try {
        switch (type) {
            case 'AUCTION_SETTLEMENT':
                await handleSettlement(auctionId);
                break;
            case 'OUTBID_NOTIFICATION':
                logger.info(`NOTIFY: User ${bidderEmail} was outbid on auction ${auctionId}. New bid: ${amount}`);
                break;
            case 'AUCTION_REMINDER':
                socketService.emitToAuction(auctionId, 'AUCTION_ENDING_SOON', {
                    auctionId,
                    secondsRemaining: 300 // 5 minutes
                });
                break;
            case 'SETTLEMENT_CLEANUP':
                await runSettlementCleanup();
                break;
        }
    } catch (error: any) {
        logger.error(`Worker error for job ${job.id} (${type}): ${error.message}`);
        throw error;
    }
}, {
    connection: redisConnection,
    concurrency: 5
});

async function handleSettlement(auctionId: number) {
    await DB.$transaction(async (tx) => {
        // Use FOR UPDATE to prevent concurrent settlement of the same auction
        const auctionResult: any[] = await tx.$queryRaw`
            SELECT id, status, "creatorId", "winnerId", "currentPrice", "endsAt" 
            FROM auction_items 
            WHERE id = ${auctionId} 
            FOR UPDATE
        `;

        if (auctionResult.length === 0) return;
        const auction = auctionResult[0];

        // Idempotency check: only settle if ACTIVE
        if (auction.status !== 'ACTIVE') {
            logger.info(`Auction ${auctionId} already settled or not active (status: ${auction.status})`);
            return;
        }

        // Check if the auction was extended
        if (new Date() < new Date(auction.endsAt)) {
            logger.info(`Auction ${auctionId} settlement skipped: Auction extended until ${auction.endsAt}`);
            // We don't need to reschedule here because `placeBid` guarantees a new job is scheduled
            // matching the new end time.
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
            socketService.emitToAuction(auctionId, 'AUCTION_SOLD', {
                auctionId,
                winnerName: winner?.email,
                finalPrice: auction.currentPrice
            });
            logger.info(`Auction ${auctionId} settled: SOLD to user ${auction.winnerId}`);
        } else {
            await tx.auctionItem.update({
                where: { id: auctionId },
                data: { status: 'EXPIRED' }
            });
            socketService.emitToAuction(auctionId, 'AUCTION_EXPIRED', { auctionId });
            logger.info(`Auction ${auctionId} settled: EXPIRED (no bids)`);
        }
    });
}

async function runSettlementCleanup() {
    logger.info('Running periodic settlement cleanup...');
    const expiredAuctions = await DB.auctionItem.findMany({
        where: {
            status: 'ACTIVE',
            endsAt: { lte: new Date() }
        }
    });

    for (const auction of expiredAuctions) {
        logger.warn(`Found missed settlement for auction ${auction.id}, queueing now.`);
        await auctionQueue.add('AUCTION_SETTLEMENT',
            { type: 'AUCTION_SETTLEMENT', auctionId: auction.id },
            { jobId: `settlement_cleanup_${auction.id}` }
        );
    }
}

// Setup repeatable job for cleanup
auctionQueue.add('SETTLEMENT_CLEANUP', { type: 'SETTLEMENT_CLEANUP' }, {
    repeat: { pattern: '*/1 * * * *' } // Every minute
});

auctionWorker.on('completed', (job) => {
    logger.info(`Job ${job.id} of type ${job.name} completed`);
});

auctionWorker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} of type ${job?.name} failed: ${err.message}`);
});

// Graceful shutdown
const shutdown = async () => {
    logger.info('Gracefully shutting down auction worker...');
    await auctionWorker.close();
    await redisConnection.quit();
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
