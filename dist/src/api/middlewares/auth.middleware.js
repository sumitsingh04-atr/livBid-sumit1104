"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const package_helper_1 = require("../../../helper/package.helper");
const logger_1 = __importDefault(require("../../../winston/logger"));
const secret = process.env.JWT_ACCESS_SECRET || 'your_secret';
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        const user = await package_helper_1.DB.user.findUnique({
            where: { id: decoded.id }
        });
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        logger_1.default.error(`AuthMiddleware error: ${error.message}`);
        return res.status(401).json({ message: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.middleware.js.map