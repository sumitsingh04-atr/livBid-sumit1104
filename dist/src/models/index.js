"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initModels = exports.Bid = exports.AuctionItem = exports.User = void 0;
const package_helper_1 = require("../../helper/package.helper");
exports.User = package_helper_1.DB.user;
exports.AuctionItem = package_helper_1.DB.auctionItem;
exports.Bid = package_helper_1.DB.bid;
const initModels = async () => {
    return { User: exports.User, AuctionItem: exports.AuctionItem, Bid: exports.Bid };
};
exports.initModels = initModels;
//# sourceMappingURL=index.js.map