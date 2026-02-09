"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const app_1 = __importDefault(require("./src/app"));
const package_helper_1 = require("./helper/package.helper");
const logger_1 = __importDefault(require("./winston/logger"));
const app = new app_1.default();
const cluster = require('cluster');
const totalCPUs = require('os').cpus().length;
const clusterEnable = process.env.clusterEnable == 'false' ? false : true;
process.on('uncaughtException', (err) => {
    logger_1.default.info('Uncaught exception : ', err);
    process.exit(1);
});
process.on('unhandledRejection', (err) => {
    logger_1.default.info('Unhandled rejection : ', err);
    process.exit(1);
});
if (cluster.isMaster && clusterEnable == true) {
    logger_1.default.info("Number of CPUs :", totalCPUs);
    logger_1.default.info(`Master ${process.pid} is running`);
    for (let i = 0; i < totalCPUs; i++)
        cluster.fork();
    cluster.on('exit', (worker) => {
        logger_1.default.info(`worker ${worker.process.pid} died`);
        logger_1.default.info('let\'s fork a new worker');
        cluster.fork();
    });
}
else {
    app.listen();
    (0, package_helper_1.InitConnections)()
        .then(() => {
        logger_1.default.info('Connections initialized successfully.');
    })
        .catch(err => {
        logger_1.default.error("Failed to initialize connections:", err);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map