# WebSocket Integration Guide

This document describes how to integrate the backend WebSocket service with your frontend application.

## 1. Connection Setup

The backend uses `socket.io`. You must provide a valid JWT for authentication during the handshake.

**Installation:**
```bash
npm install socket.io-client
```

**Connection Example (React/Vue/JS):**
```javascript
import { io } from 'socket.io-client';

const socket = io('https://your-api-url.com', {
  auth: {
    token: 'YOUR_JWT_ACCESS_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});
```

---

## 2. Room Management

To receive updates for a specific auction, you must join its "room".

### Join Auction Room
**Event:** `joinAuction`
**Payload:** `auctionId` (string)

```javascript
socket.emit('joinAuction', '123');
```

Upon joining, the server will:
1. Add your socket to the room `auction:123`.
2. Emit `VIEWER_COUNT` to all users in that room.
3. Emit `AUCTION_STATE` specifically to you with the current snapshot.

### Leave Auction Room
**Event:** `leaveAuction`
**Payload:** `auctionId` (string)

```javascript
socket.emit('leaveAuction', '123');
```

---

## 3. Event Reference

### From Server to Client (Listening)

#### `VIEWER_COUNT`
Triggered when someone joins or leaves the auction.
```json
{
  "auctionId": "123",
  "count": 5
}
```

#### `AUCTION_STATE`
Sent immediately after `joinAuction` to provide the current state.
```json
{
  "auctionId": 123,
  "currentPrice": 1500,
  "endsAt": "2026-02-10T10:00:00Z",
  "status": "ACTIVE",
  "lastBid": {
    "amount": 1500,
    "bidderName": "user@example.com",
    "timestamp": "2026-02-09T18:00:00Z"
  }
}
```

#### `NEW_BID`
Triggered when a new bid is successfully placed.
```json
{
  "amount": 1600,
  "bidderName": "bidder@example.com",
  "timestamp": "2026-02-09T18:05:00Z"
}
```

#### `AUCTION_ENDING_SOON`
Triggered 5 minutes before the auction ends.
```json
{
  "auctionId": "123",
  "secondsRemaining": 300
}
```

#### `AUCTION_SOLD`
Triggered when the auction ends with a winner.
```json
{
  "auctionId": "123",
  "winnerName": "winner@example.com",
  "finalPrice": 2000
}
```

#### `AUCTION_EXPIRED`
Triggered when the auction ends with no bids.
```json
{
  "auctionId": "123"
}
```

---

## 4. Real-time UI Updates

| Field | Event to Listen For | Action |
| :--- | :--- | :--- |
| **Current Price** | `NEW_BID`, `AUCTION_STATE` | Update the displayed price immediately. |
| **Bid History** | `NEW_BID` | Prepend the new bid to your local history list. |
| **Viewer Count** | `VIEWER_COUNT` | Update the "Live Viewers" badge. |
| **Timer/Countdown** | `AUCTION_STATE` | Sync your countdown timer with `endsAt`. |
| **Auction Status** | `AUCTION_SOLD`, `AUCTION_EXPIRED` | Show a "Sold" or "Closed" overlay. |
