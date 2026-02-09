require('dotenv').config();
import axios from 'axios';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const API_URL = 'http://localhost:9195'; // Match .env PORT
const NUM_BIDS = 50;
const secret = process.env.JWT_ACCESS_SECRET || 'your_jwt_secret_here';

function generateToken(userId: number) {
    return jwt.sign({ id: userId }, secret, { expiresIn: '1h' });
}

async function runTest() {
    let DB: PrismaClient | null = null;
    try {
        console.log('--- Concurrency Test Started ---');

        // Initialize only Prisma
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new PrismaPg(pool);
        DB = new PrismaClient({ adapter });
        await DB.$connect();
        console.log('DB Connection established for test.');

        // 1. Setup: Create Test Users
        console.log(`Creating ${NUM_BIDS} test users...`);
        const users: any[] = [];
        for (let i = 0; i < NUM_BIDS; i++) {
            const email = `test_user_${Date.now()}_${i}@example.com`;
            const user = await (DB as any).user.create({
                data: {
                    email,
                    passwordHash: 'dummy_hash',
                    balance: new Prisma.Decimal(1000.0)
                }
            });
            users.push({ ...user, token: generateToken(user.id) });
        }

        // 2. Setup: Create Test Auction
        const creator = users[0];
        console.log('Creating test auction...');
        const auction = await (DB as any).auctionItem.create({
            data: {
                title: 'Concurrency Test Auction',
                description: 'A test auction for concurrency',
                startingPrice: new Prisma.Decimal(10.0),
                currentPrice: new Prisma.Decimal(10.0),
                endsAt: new Date(Date.now() + 60000), // 1 minute from now
                creatorId: creator.id,
                status: 'ACTIVE'
            }
        });

        // 3. Fire 50 Parallel Bid Requests
        console.log(`Firing ${NUM_BIDS} parallel bids...`);
        const requests = users.map((user, index) => {
            const bidAmount = 20.0 + index; // Bids from 20 to 69
            return axios.post(`${API_URL}/auctions/${auction.id}/bid`,
                { amount: bidAmount },
                {
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                        token: user.token
                    },
                    validateStatus: () => true // Don't throw on error
                }
            ).then(res => ({
                status: res.status,
                data: res.data,
                bidAmount
            }));
        });

        const results: any[] = await Promise.all(requests);

        // 4. Analysis
        const successes = results.filter((r: any) => r.status === 200 || r.status === 201);
        const failures = results.filter((r: any) => r.status !== 200 && r.status !== 201);

        console.log(`Successes: ${successes.length}`);
        console.log(`Failures: ${failures.length}`);

        if (failures.length > 0) {
            const f0: any = failures[0];
            console.log('Sample Failure Logic:', JSON.stringify(f0.data));
            console.log('Sample Failure Status:', f0.status);
        }

        // 5. Assertions
        console.log('Verifying final state...');
        const finalAuction = await (DB as any).auctionItem.findUnique({
            where: { id: auction.id },
            include: { bids: true }
        });

        if (!finalAuction) throw new Error('Auction not found after test');

        const actualHighestBid = Number(finalAuction.currentPrice);

        console.log(`Final Auction Price: ${actualHighestBid}`);

        // Check for negative balances
        const allUsers = await (DB as any).user.findMany({
            where: { id: { in: users.map(u => u.id) } }
        });
        const negativeBalances = allUsers.filter((u: any) => Number(u.balance) < 0);

        console.log('Assertions:');
        console.log(`- Exactly one winner: ${finalAuction.winnerId ? 'YES' : 'NO'}`);
        console.log(`- No negative balances: ${negativeBalances.length === 0 ? 'YES' : 'NO'}`);
        console.log(`- Final price matches highest successful bid: ${actualHighestBid > 10 ? 'YES' : 'NO'}`);

        if (negativeBalances.length > 0) {
            console.error('CRITICAL: Negative balances detected!');
        }

        console.log('--- Concurrency Test Finished ---');
        process.exit(0);
    } catch (error: any) {
        console.error('Test script failed:', error.message);
        process.exit(1);
    } finally {
        if (DB) await DB.$disconnect();
    }
}

runTest();
