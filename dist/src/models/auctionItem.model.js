"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionItem = exports.AuctionStatus = void 0;
const sequelize_1 = require("sequelize");
const package_helper_1 = require("../../helper/package.helper");
var AuctionStatus;
(function (AuctionStatus) {
    AuctionStatus["DRAFT"] = "draft";
    AuctionStatus["ACTIVE"] = "active";
    AuctionStatus["SOLD"] = "sold";
    AuctionStatus["EXPIRED"] = "expired";
})(AuctionStatus || (exports.AuctionStatus = AuctionStatus = {}));
class AuctionItem extends sequelize_1.Model {
}
exports.AuctionItem = AuctionItem;
AuctionItem.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    startingPrice: {
        type: sequelize_1.DataTypes.DECIMAL(20, 8),
        allowNull: false,
    },
    currentPrice: {
        type: sequelize_1.DataTypes.DECIMAL(20, 8),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(AuctionStatus)),
        allowNull: false,
        defaultValue: AuctionStatus.DRAFT,
    },
    creatorId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    winnerId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    endsAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
}, {
    sequelize: package_helper_1.DB,
    tableName: 'auction_items',
    timestamps: true,
    updatedAt: false,
});
//# sourceMappingURL=auctionItem.model.js.map