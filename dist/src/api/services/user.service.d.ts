declare class UserService {
    getUserProfile(userId: number): Promise<{
        wonAuctions: {
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
        }[];
        id: number;
        email: string;
        balance: import("@prisma/client-runtime-utils").Decimal;
        createdAt: Date;
    }>;
}
declare const _default: UserService;
export default _default;
//# sourceMappingURL=user.service.d.ts.map