import { format, transports, createLogger } from 'winston';
const isDevelopment = process.env.NODE_ENV === 'development';

const consoleOpts = {
    handleExceptions: true,
    handleRejections: true,
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors(),
        format.json(),
        isDevelopment ? format.colorize() : format.uncolorize(),
    ),
    transports: [
        new transports.Console({
            format: isDevelopment
              ? format.combine(
                  format.colorize(),
                  format.simple(),
                  format.printf(({ timestamp, level, message, stack, ...meta }) => {
                    let logMessage = `${timestamp} [${level}]: ${message}`;
      
                    if (stack) {
                      logMessage += `\n${stack}`;
                    }
      
                    if (Object.keys(meta).length > 0) {
                      logMessage += `\n${JSON.stringify(meta, null, 2)}`;
                    }
      
                    return logMessage;
                  })
                )
              : format.combine(format.timestamp(), format.json())
          })
    ],
    exitOnError: false
};


const logger = createLogger(consoleOpts);

export default logger;