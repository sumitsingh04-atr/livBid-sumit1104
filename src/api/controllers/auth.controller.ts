import { Request, Response } from 'express';
import authService from '../services/auth.service';
import logger from '../../../winston/logger';

class AuthController {
    public async register(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }

            const result = await authService.register({ email, password });

            return res.status(201).json({
                message: 'User registered successfully',
            });
        } catch (error: any) {
            logger.error(`AuthController.register error: ${error.message}`);
            return res.status(400).json({ message: error.message });
        }
    }

    public async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required' });
            }

            const result = await authService.login({ email, password });

            return res.status(200).json({
                message: 'Login successful',
                data: result
            });
        } catch (error: any) {
            logger.error(`AuthController.login error: ${error.message}`);
            return res.status(401).json({ message: error.message });
        }
    }
}

export default new AuthController();
