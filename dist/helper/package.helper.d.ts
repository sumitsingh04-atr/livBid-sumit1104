import { PrismaClient } from '@prisma/client';
export declare let DB: PrismaClient;
export declare let Redis: any;
/**
 * Initializes Database, Redis, and Kafka connections
 */
export declare const InitConnections: () => Promise<void>;
/**
 * Closes Database, Redis, and Kafka connections gracefully
 */
export declare const CloseConnections: () => Promise<void>;
//# sourceMappingURL=package.helper.d.ts.map