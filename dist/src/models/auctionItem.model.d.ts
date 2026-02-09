import { Model } from 'sequelize';
export declare enum AuctionStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    SOLD = "sold",
    EXPIRED = "expired"
}
export declare class AuctionItem extends Model {
    id: number;
    title: string;
    description: string;
    startingPrice: number;
    currentPrice: number;
    status: AuctionStatus;
    creatorId: number;
    winnerId: number | null;
    endsAt: Date;
    readonly createdAt: Date;
}
//# sourceMappingURL=auctionItem.model.d.ts.map