"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const package_helper_1 = require("../../../helper/package.helper");
const logger_1 = __importDefault(require("../../../winston/logger"));
class UserService {
    async getUserProfile(userId) {
        try {
            const user = await package_helper_1.DB.user.findUnique({
                where: { id: userId },
                include: {
                    wonAuctions: true
                }
            });
            if (!user) {
                throw new Error('User not found');
            }
            // Exclude passwordHash
            const { passwordHash, ...profile } = user;
            return profile;
        }
        catch (error) {
            logger_1.default.error(`UserService.getUserProfile error: ${error.message}`);
            throw error;
        }
    }
}
exports.default = new UserService();
//# sourceMappingURL=user.service.js.map