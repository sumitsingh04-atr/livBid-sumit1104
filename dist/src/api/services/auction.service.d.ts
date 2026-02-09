declare class AuctionService {
    createAuction(data: any, creatorId: number): Promise<{
        id: number;
        createdAt: Date;
        title: string;
        description: string;
        startingPrice: import("@prisma/client-runtime-utils").Decimal;
        currentPrice: import("@prisma/client-runtime-utils").Decimal;
        status: import(".prisma/client").$Enums.AuctionStatus;
        creatorId: number;
        winnerId: number | null;
        endsAt: Date;
    }>;
    getAuctions(query: any): Promise<{
        auctions: ({
            creator: {
                id: number;
                email: string;
            };
        } & {
            id: number;
            createdAt: Date;
            title: string;
            description: string;
            startingPrice: import("@prisma/client-runtime-utils").Decimal;
            currentPrice: import("@prisma/client-runtime-utils").Decimal;
            status: import(".prisma/client").$Enums.AuctionStatus;
            creatorId: number;
            winnerId: number | null;
            endsAt: Date;
        })[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getAuctionById(id: number): Promise<{
        creator: {
            id: number;
            email: string;
        };
        bids: ({
            bidder: {
                id: number;
                email: string;
            };
        } & {
            id: number;
            createdAt: Date;
            amount: import("@prisma/client-runtime-utils").Decimal;
            bidderId: number;
            auctionItemId: number;
        })[];
    } & {
        id: number;
        createdAt: Date;
        title: string;
        description: string;
        startingPrice: import("@prisma/client-runtime-utils").Decimal;
        currentPrice: import("@prisma/client-runtime-utils").Decimal;
        status: import(".prisma/client").$Enums.AuctionStatus;
        creatorId: number;
        winnerId: number | null;
        endsAt: Date;
    }>;
    placeBid(auctionId: number, bidderId: number, amount: number): Promise<{
        bid: {
            id: number;
            createdAt: Date;
            amount: import("@prisma/client-runtime-utils").Decimal;
            bidderId: number;
            auctionItemId: number;
        };
        updatedAuction: {
            id: number;
            createdAt: Date;
            title: string;
            description: string;
            startingPrice: import("@prisma/client-runtime-utils").Decimal;
            currentPrice: import("@prisma/client-runtime-utils").Decimal;
            status: import(".prisma/client").$Enums.AuctionStatus;
            creatorId: number;
            winnerId: number | null;
            endsAt: Date;
        };
    }>;
}
declare const _default: AuctionService;
export default _default;
//# sourceMappingURL=auction.service.d.ts.map