"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_service_1 = __importDefault(require("../services/user.service"));
const logger_1 = __importDefault(require("../../../winston/logger"));
class UserController {
    async me(req, res) {
        try {
            const userId = req.user.id;
            const profile = await user_service_1.default.getUserProfile(userId);
            return res.status(200).json(profile);
        }
        catch (error) {
            logger_1.default.error(`UserController.me error: ${error.message}`);
            return res.status(500).json({ message: error.message });
        }
    }
}
exports.default = new UserController();
//# sourceMappingURL=user.controller.js.map