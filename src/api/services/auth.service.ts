import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DB } from '../../../helper/package.helper';
import logger from '../../../winston/logger';


class AuthService {
    private secret = process.env.JWT_ACCESS_SECRET || 'your_secret';

    public async register(userData: any) {
        try {
            const { email, password } = userData;

            const existingUser = await DB.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                throw new Error('User already exists');
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const user = await DB.user.create({
                data: {
                    email,
                    passwordHash
                }
            });

            const token = this.generateToken(user.id);

            return { user, token };
        } catch (error: any) {
            logger.error(`AuthService.register error: ${error.message}`);
            throw error;
        }
    }

    public async login(credentials: any) {
        try {
            const { email, password } = credentials;

            const user = await DB.user.findUnique({
                where: { email }
            });

            if (!user) {
                throw new Error('Email not registered. Please check your email or register.');
            }

            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

            if (!isPasswordValid) {
                throw new Error('Invalid credentials');
            }

            const token = this.generateToken(user.id);

            return { token };
        } catch (error: any) {
            logger.error(`AuthService.login error: ${error.message}`);
            throw error;
        }
    }

    private generateToken(userId: number) {
        return jwt.sign({ id: userId }, this.secret, { expiresIn: '1d' });
    }
}

export default new AuthService();
