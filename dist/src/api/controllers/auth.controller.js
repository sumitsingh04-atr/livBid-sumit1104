"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_service_1 = __importDefault(require("../services/auth.service"));
const logger_1 = __importDefault(require("../../../winston/logger"));
class AuthController {
    async register(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }
            const result = await auth_service_1.default.register({ email, password });
            return res.status(201).json({
                message: 'User registered successfully',
            });
        }
        catch (error) {
            logger_1.default.error(`AuthController.register error: ${error.message}`);
            return res.status(400).json({ message: error.message });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }
            const result = await auth_service_1.default.login({ email, password });
            return res.status(200).json({
                message: 'Login successful',
                data: result
            });
        }
        catch (error) {
            logger_1.default.error(`AuthController.login error: ${error.message}`);
            return res.status(401).json({ message: error.message });
        }
    }
}
exports.default = new AuthController();
//# sourceMappingURL=auth.controller.js.map