import { DB, InitConnections } from '../helper/package.helper';
import { auctionQueue } from '../src/api/workers/auction.worker';
import auctionService from '../src/api/services/auction.service';
import logger from '../winston/logger';

async function testBackgroundJobs() {
    try {
        await InitConnections();
        console.log('--- Starting Background Jobs Test ---');

        // 1. Create a test creator and bidder
        const creator = await DB.user.upsert({
            where: { email: 'creator@test.com' },
            update: {},
            create: { email: 'creator@test.com', passwordHash: 'hash', balance: 0 }
        });

        const bidder1 = await DB.user.upsert({
            where: { email: 'bidder1@test.com' },
            update: { balance: 1000 },
            create: { email: 'bidder1@test.com', passwordHash: 'hash', balance: 1000 }
        });

        const bidder2 = await DB.user.upsert({
            where: { email: 'bidder2@test.com' },
            update: { balance: 2000 },
            create: { email: 'bidder2@test.com', passwordHash: 'hash', balance: 2000 }
        });

        // 2. Create an auction ending in 10 seconds
        const endsAt = new Date(Date.now() + 10000);
        const auction = await auctionService.createAuction({
            title: 'Quick Auction',
            description: 'Ends in 10s',
            startingPrice: 100,
            endsAt: endsAt.toISOString()
        }, creator.id);

        console.log(`Auction created with ID: ${auction.id}, ends at: ${endsAt.toISOString()}`);

        // 3. Place a bid
        await auctionService.placeBid(auction.id, bidder1.id, 150);
        console.log('Bid placed by bidder1: 150');

        // 4. Place another bid to trigger outbid notification
        await auctionService.placeBid(auction.id, bidder2.id, 200);
        console.log('Bid placed by bidder2: 200 (should trigger outbid for bidder1)');

        // 5. Wait for settlement
        console.log('Waiting for settlement (12 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 12000));

        // 6. Verify results
        const settledAuction = await DB.auctionItem.findUnique({
            where: { id: auction.id },
            include: { winner: true }
        });

        console.log('Settled Auction Status:', settledAuction?.status);
        console.log('Winner:', settledAuction?.winner?.email);

        const updatedCreator = await DB.user.findUnique({ where: { id: creator.id } });
        console.log('Creator Balance:', updatedCreator?.balance.toString());

        if (settledAuction?.status === 'SOLD' && updatedCreator?.balance.toString() === '200.00000000') {
            console.log('✅ Settlement and fund transfer successful!');
        } else {
            console.log('❌ Settlement failed or balance incorrect.');
        }

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await DB.$disconnect();
        process.exit(0);
    }
}

testBackgroundJobs();
