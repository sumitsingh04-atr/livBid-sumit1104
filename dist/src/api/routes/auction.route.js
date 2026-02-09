"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auction_controller_1 = __importDefault(require("../controllers/auction.controller"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/', auth_middleware_1.authenticate, auction_controller_1.default.create);
router.get('/', auction_controller_1.default.list);
router.get('/:id', auction_controller_1.default.getById);
router.post('/:id/bid', auth_middleware_1.authenticate, auction_controller_1.default.bid);
exports.default = router;
//# sourceMappingURL=auction.route.js.map