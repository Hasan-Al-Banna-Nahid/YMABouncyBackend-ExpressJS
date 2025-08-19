import winston from 'winston';
import { Request, Response, NextFunction } from 'express';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    logger.info({
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    next();
};

export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error({
        status: err.statusCode || 500,
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
    });
    next(err);
};

export default logger;