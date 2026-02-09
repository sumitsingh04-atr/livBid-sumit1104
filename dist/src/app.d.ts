import express from 'express';
import './api/workers/auction.worker';
declare class App {
    app: express.Application;
    server: any;
    constructor();
    private initializeMiddlewares;
    private initializeRoutes;
    listen(): Promise<any>;
    private healthCheck;
    private setupGracefulShutdown;
}
export default App;
//# sourceMappingURL=app.d.ts.map