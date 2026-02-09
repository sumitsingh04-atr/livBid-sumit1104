import { Model } from 'sequelize';
export declare class Bid extends Model {
    id: number;
    amount: number;
    bidderId: number;
    auctionItemId: number;
    readonly createdAt: Date;
}
//# sourceMappingURL=bid.model.d.ts.map