"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bid = void 0;
const sequelize_1 = require("sequelize");
const package_helper_1 = require("../../helper/package.helper");
class Bid extends sequelize_1.Model {
}
exports.Bid = Bid;
Bid.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(20, 8),
        allowNull: false,
    },
    bidderId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    auctionItemId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize: package_helper_1.DB,
    tableName: 'bids',
    timestamps: true,
    updatedAt: false,
});
//# sourceMappingURL=bid.model.js.map