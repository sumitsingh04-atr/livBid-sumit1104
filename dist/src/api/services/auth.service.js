"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const package_helper_1 = require("../../../helper/package.helper");
const logger_1 = __importDefault(require("../../../winston/logger"));
class AuthService {
    constructor() {
        this.secret = process.env.JWT_ACCESS_SECRET || 'your_secret';
    }
    async register(userData) {
        try {
            const { email, password } = userData;
            const existingUser = await package_helper_1.DB.user.findUnique({
                where: { email }
            });
            if (existingUser) {
                throw new Error('User already exists');
            }
            const passwordHash = await bcryptjs_1.default.hash(password, 10);
            const user = await package_helper_1.DB.user.create({
                data: {
                    email,
                    passwordHash
                }
            });
            const token = this.generateToken(user.id);
            return { user, token };
        }
        catch (error) {
            logger_1.default.error(`AuthService.register error: ${error.message}`);
            throw error;
        }
    }
    async login(credentials) {
        try {
            const { email, password } = credentials;
            const user = await package_helper_1.DB.user.findUnique({
                where: { email }
            });
            if (!user) {
                throw new Error('Email not registered. Please check your email or register.');
            }
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                throw new Error('Invalid credentials');
            }
            const token = this.generateToken(user.id);
            return { token };
        }
        catch (error) {
            logger_1.default.error(`AuthService.login error: ${error.message}`);
            throw error;
        }
    }
    generateToken(userId) {
        return jsonwebtoken_1.default.sign({ id: userId }, this.secret, { expiresIn: '1d' });
    }
}
exports.default = new AuthService();
//# sourceMappingURL=auth.service.js.map