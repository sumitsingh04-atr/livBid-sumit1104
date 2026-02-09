"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const logger_1 = __importDefault(require("../winston/logger"));
const package_helper_1 = require("../helper/package.helper");
const auth_route_1 = __importDefault(require("./api/routes/auth.route"));
const auction_route_1 = __importDefault(require("./api/routes/auction.route"));
const user_route_1 = __importDefault(require("./api/routes/user.route"));
const socket_service_1 = __importDefault(require("./api/websocket/socket.service"));
require("./api/workers/auction.worker");
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.initializeMiddlewares();
        this.setupGracefulShutdown();
    }
    initializeMiddlewares() {
        this.app.use((0, cors_1.default)({
            origin: [
                'http://localhost:3000',
                'http://localhost:5173',
                'http://192.168.25.75:3000',
                'https://krystal-solutional-cherish.ngrok-free.dev'
            ],
            credentials: true
        }));
        this.app.use(express_1.default.json());
        this.healthCheck();
        this.initializeRoutes();
    }
    initializeRoutes() {
        this.app.use('/auth', auth_route_1.default);
        this.app.use('/auctions', auction_route_1.default);
        this.app.use('/users', user_route_1.default);
    }
    async listen() {
        const PORT = process.env.PORT || 3001;
        this.server = this.app.listen(PORT, () => {
            logger_1.default.info(`Server is running on port ${PORT}`);
        });
        socket_service_1.default.init(this.server);
        return this.server;
    }
    healthCheck() {
        this.app.get('/health', async (req, res) => {
            try {
                // Simple DB check
                await package_helper_1.DB.$queryRaw `SELECT 1`;
                return res.json({
                    status: 'ok',
                    database: 'connected',
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                logger_1.default.error(`Health check failed: ${error.message}`);
                return res.status(503).json({
                    status: 'error',
                    message: error.message
                });
            }
        });
    }
    setupGracefulShutdown() {
        let isShuttingDown = false;
        const shutDown = async (signal) => {
            if (isShuttingDown)
                return;
            isShuttingDown = true;
            logger_1.default.info(`Received ${signal}. Shutting down gracefully...`);
            if (this.server) {
                this.server.close(async () => {
                    logger_1.default.info('HTTP server closed.');
                    await (0, package_helper_1.CloseConnections)();
                    process.exit(0);
                });
            }
            else {
                await (0, package_helper_1.CloseConnections)();
                process.exit(0);
            }
            // Force exit if shutdown takes too long
            setTimeout(() => {
                logger_1.default.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => shutDown('SIGTERM'));
        process.on('SIGINT', () => shutDown('SIGINT'));
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map