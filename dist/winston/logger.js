"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const isDevelopment = process.env.NODE_ENV === 'development';
const consoleOpts = {
    handleExceptions: true,
    handleRejections: true,
    level: 'info',
    format: winston_1.format.combine(winston_1.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.errors(), winston_1.format.json(), isDevelopment ? winston_1.format.colorize() : winston_1.format.uncolorize()),
    transports: [
        new winston_1.transports.Console({
            format: isDevelopment
                ? winston_1.format.combine(winston_1.format.colorize(), winston_1.format.simple(), winston_1.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                    let logMessage = `${timestamp} [${level}]: ${message}`;
                    if (stack) {
                        logMessage += `\n${stack}`;
                    }
                    if (Object.keys(meta).length > 0) {
                        logMessage += `\n${JSON.stringify(meta, null, 2)}`;
                    }
                    return logMessage;
                }))
                : winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json())
        })
    ],
    exitOnError: false
};
const logger = (0, winston_1.createLogger)(consoleOpts);
exports.default = logger;
//# sourceMappingURL=logger.js.map