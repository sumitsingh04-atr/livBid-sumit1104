import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as Helpers from '@antiers/helper-package';
import logger from "../winston/logger";
import KafkaHelper from "./kafka.helper";

// Configuration from environment variables
const config = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        name: process.env.DB_NAME || 'userservice',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
    },
    redis: {
        host: process.env.REDIS_HOSTNAME,
        port: process.env.REDIS_PORT,
        auth: process.env.REDIS_AUTH,
        jwtsecret: process.env.JWT_ACCESS_SECRET,
        redisUserTokenDb: process.env.REDIS_USER_TOKEN_DB
    },
    kafka: {
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092']
    }
};

export let DB: PrismaClient;
export let Redis: any;

/**
 * Initializes Database, Redis, and Kafka connections
 */
export const InitConnections = async () => {
    try {
        // Initialize Redis
        Redis = new Helpers.redisHelper(config.redis);
        logger.info('Redis Connection initialized.');

        // Initialize Kafka
        await KafkaHelper.connect(config.kafka);
        logger.info('Kafka Connection initialized.');

        // Initialize Prisma
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new PrismaPg(pool);
        DB = new PrismaClient({ adapter });
        await DB.$connect();
        logger.info('DB Connection established successfully with Prisma (using adapter).');

    } catch (error) {
        logger.error('Failed to initialize connections:', error);
        throw error;
    }
};

/**
 * Closes Database, Redis, and Kafka connections gracefully
 */
export const CloseConnections = async () => {
    try {
        if (DB) {
            await DB.$disconnect();
            logger.info('DB Connection closed (Prisma).');
        }
        if (Redis && typeof Redis.quit === 'function') {
            await Redis.quit();
            logger.info('Redis Connection closed.');
        }
        await KafkaHelper.disconnect();
        logger.info('Kafka Connection closed.');
    } catch (error) {
        logger.error('Error closing connections:', error);
    }
};


