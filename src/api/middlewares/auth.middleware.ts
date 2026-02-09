import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DB } from '../../../helper/package.helper';
import logger from '../../../winston/logger';

const secret = process.env.JWT_ACCESS_SECRET || 'your_secret';

export interface AuthRequest extends Request {
    user?: any;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token as string, secret as string);

        const user = await DB.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error: any) {
        logger.error(`AuthMiddleware error: ${error.message}`);
        return res.status(401).json({ message: 'Invalid token' });
    }
};
