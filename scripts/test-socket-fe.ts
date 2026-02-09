import { io } from 'socket.io-client';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:3000'; // Adjust as needed
const SOCKET_URL = 'http://localhost:3000';
const TEST_AUCTION_ID = '1'; // Replace with a real ID for manual test or dynamic one

async function testSocket() {
    console.log('--- Starting WebSocket Integration Test ---');

    // 1. Get a JWT (Assuming you have a test user or login endpoint)
    // For this script, we'll try to use a token from .env or prompt
    const token = process.env.TEST_TOKEN;
    if (!token) {
        console.error('ERROR: No TEST_TOKEN found in .env');
        return;
    }

    // 2. Connect to Socket.io
    const socket = io(SOCKET_URL, {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('✅ Connected to WebSocket server');

        // 3. Join Auction
        console.log(`Joining auction ${TEST_AUCTION_ID}...`);
        socket.emit('joinAuction', TEST_AUCTION_ID);
    });

    socket.on('VIEWER_COUNT', (data) => {
        console.log('📈 Received VIEWER_COUNT:', data);
    });

    socket.on('AUCTION_STATE', (data) => {
        console.log('📋 Received AUCTION_STATE:', data);
    });

    socket.on('NEW_BID', (data) => {
        console.log('💰 Received NEW_BID:', data);
    });

    socket.on('connect_error', (err) => {
        console.error('❌ Connection Error:', err.message);
    });

    // Keep script running to listen for events
    console.log('Listening for events... (Press Ctrl+C to stop)');
}

testSocket().catch(console.error);
