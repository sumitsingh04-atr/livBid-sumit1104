"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloseConnections = exports.InitConnections = exports.Redis = exports.DB = void 0;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const Helpers = __importStar(require("@antiers/helper-package"));
const logger_1 = __importDefault(require("../winston/logger"));
const kafka_helper_1 = __importDefault(require("./kafka.helper"));
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
/**
 * Initializes Database, Redis, and Kafka connections
 */
const InitConnections = async () => {
    try {
        // Initialize Redis
        exports.Redis = new Helpers.redisHelper(config.redis);
        logger_1.default.info('Redis Connection initialized.');
        // Initialize Kafka
        await kafka_helper_1.default.connect(config.kafka);
        logger_1.default.info('Kafka Connection initialized.');
        // Initialize Prisma
        const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
        const adapter = new adapter_pg_1.PrismaPg(pool);
        exports.DB = new client_1.PrismaClient({ adapter });
        await exports.DB.$connect();
        logger_1.default.info('DB Connection established successfully with Prisma (using adapter).');
    }
    catch (error) {
        logger_1.default.error('Failed to initialize connections:', error);
        throw error;
    }
};
exports.InitConnections = InitConnections;
/**
 * Closes Database, Redis, and Kafka connections gracefully
 */
const CloseConnections = async () => {
    try {
        if (exports.DB) {
            await exports.DB.$disconnect();
            logger_1.default.info('DB Connection closed (Prisma).');
        }
        if (exports.Redis && typeof exports.Redis.quit === 'function') {
            await exports.Redis.quit();
            logger_1.default.info('Redis Connection closed.');
        }
        await kafka_helper_1.default.disconnect();
        logger_1.default.info('Kafka Connection closed.');
    }
    catch (error) {
        logger_1.default.error('Error closing connections:', error);
    }
};
exports.CloseConnections = CloseConnections;
//# sourceMappingURL=package.helper.js.map