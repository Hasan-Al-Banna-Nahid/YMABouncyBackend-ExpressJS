
import http from 'http';
import app from './app';
import { config } from './config/config';
import logger from './utils/logger';

const server = http.createServer(app);

server.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
});

process.on('unhandledRejection', (err: Error) => {
    logger.error('Unhandled Rejection:', err);
    server.close(() => {
        process.exit(1);
    });
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
    });
});