# LiveBid — Real-Time Auction Platform

## Architecture Overview

This system is built using Node.js/Express, Prisma ORM, and PostgreSQL. It uses Socket.IO for real-time updates and BullMQ (Redis-backed) for background job processing.

### Key Components:

- **API**: Handles user auth, auction lifecycle, and bidding.
- **WebSocket Gateway**: Manages live connections, rooms, and viewer counts.
- **Workers**: Handles auction settlement, reminders, and outbid notifications.
- **Database**: PostgreSQL with Prisma for type-safe queries.
- **Cache/Queue**: Redis for viewer counts and BullMQ jobs.

## Concurrency & Locking Strategy

**Pessimistic Locking** (`SELECT ... FOR UPDATE`) was chosen for the bid endpoint.

- **Reasoning**: In a high-concurrency auction system, multiple users often bid at the same time. Pessimistic locking ensures that only one transaction can modify an auction item at a time, preventing race conditions (e.g., two users both thinking they are the highest bidder). It avoids the "retry storm" that can happen with optimistic locking when contention is very high.

## Real-Time Events

- `NEW_BID`: Broadcasted to `auction:{id}` room after a successful database commit.
- `VIEWER_COUNT`: Updated via `joinAuction`/`leaveAuction` events and broadcasted to the room.
- `AUCTION_SOLD`/`EXPIRED`: Triggered by the background settlement worker.

## Background Jobs (Idempotency)

BullMQ is used to ensure jobs are processed reliably.

- **Idempotency**: Settlement jobs use database transactions to check the auction status before processing. If a job is retried, it checks if the auction is already `SOLD` or `EXPIRED` and skips processing if so.

## How to Run

### 1. Setup Environment

```bash
cp .env.example .env
# Update .env with your credentials
```

### 2. Docker Compose

```bash
docker-compose up --build
```

### 3. Run Concurrency Test

```bash
npx ts-node scripts/test-concurrency.ts
```

## Bonus Features

- **Anti-Sniping**: Auctions are extended by 30 seconds if a bid is placed in the final 10 seconds.
- **Escrow Model**: Bidders' balances are deducted immediately, and the previous bidder is refunded atomically in the same transaction.
# livBid-sumit1104
