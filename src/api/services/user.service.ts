import { DB } from '../../../helper/package.helper';
import logger from '../../../winston/logger';

class UserService {
    public async getUserProfile(userId: number) {
        try {
            const user = await DB.user.findUnique({
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
        } catch (error: any) {
            logger.error(`UserService.getUserProfile error: ${error.message}`);
            throw error;
        }
    }
}

export default new UserService();
