import winston from 'winston';
const { combine, timestamp, json, splat } = winston.format;

export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp(), json(), splat()),
    transports: [new winston.transports.Console()],
});