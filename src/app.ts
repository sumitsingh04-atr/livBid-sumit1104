
import express from 'express';
import cors from 'cors';
import logger from '../winston/logger';
import { CloseConnections, DB } from '../helper/package.helper';
import authRoutes from './api/routes/auth.route';
import auctionRoutes from './api/routes/auction.route';
import userRoutes from './api/routes/user.route';
import socketService from './api/websocket/socket.service';
import './api/workers/auction.worker';


class App {
    public app: express.Application;
    public server: any;

    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.setupGracefulShutdown();
    }

    private initializeMiddlewares() {
        this.app.use(cors({
            origin: [
                'http://localhost:3000',
                'http://localhost:5173',
                'http://192.168.25.75:3000',
                'https://krystal-solutional-cherish.ngrok-free.dev'
            ],
            credentials: true
        }));
        this.app.use(express.json());
        this.healthCheck();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.app.use('/auth', authRoutes);
        this.app.use('/auctions', auctionRoutes);
        this.app.use('/users', userRoutes);
    }

    public async listen(): Promise<any> {
        const PORT = process.env.PORT || 3001;
        this.server = this.app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
        socketService.init(this.server);
        return this.server;
    }

    private healthCheck() {
        this.app.get('/health', async (req: any, res: any) => {
            try {
                // Simple DB check
                await DB.$queryRaw`SELECT 1`;

                return res.json({
                    status: 'ok',
                    database: 'connected',
                    timestamp: new Date().toISOString()
                });
            } catch (error: any) {
                logger.error(`Health check failed: ${error.message}`);
                return res.status(503).json({
                    status: 'error',
                    message: error.message
                });
            }
        });
    }

    private setupGracefulShutdown() {
        let isShuttingDown = false;

        const shutDown = async (signal: string) => {
            if (isShuttingDown) return;
            isShuttingDown = true;

            logger.info(`Received ${signal}. Shutting down gracefully...`);

            if (this.server) {
                this.server.close(async () => {
                    logger.info('HTTP server closed.');
                    await CloseConnections();
                    process.exit(0);
                });
            } else {
                await CloseConnections();
                process.exit(0);
            }

            // Force exit if shutdown takes too long
            setTimeout(() => {
                logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutDown('SIGTERM'));
        process.on('SIGINT', () => shutDown('SIGINT'));
    }
}

export default App;