require('dotenv').config();
import App from './src/app';
import { InitConnections } from './helper/package.helper';
import  logger  from './winston/logger'

const app: any = new App();
const cluster = require('cluster');
const totalCPUs = require('os').cpus().length;

const clusterEnable: any = process.env.clusterEnable == 'false' ? false : true;

process.on('uncaughtException', (err: any) => {
    logger.info('Uncaught exception : ', err);
    process.exit(1);
})

process.on('unhandledRejection', (err: any) => {
    logger.info('Unhandled rejection : ', err);
    process.exit(1);
})

if (cluster.isMaster && clusterEnable == true)
{
    logger.info("Number of CPUs :", totalCPUs);
    logger.info(`Master ${process.pid} is running`);

    for (let i=0; i<totalCPUs; i++)
        cluster.fork();

    cluster.on('exit',(worker : any) => {
        logger.info(`worker ${worker.process.pid} died`);
        logger.info('let\'s fork a new worker');
        cluster.fork();
    })
}else{
    app.listen();
    InitConnections()
    .then(() => {
        logger.info('Connections initialized successfully.');
    })
    .catch(err => {
        logger.error("Failed to initialize connections:", err);
        process.exit(1);
    });
}