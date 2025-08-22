"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const config_1 = require("./app/config/config");
const logger_1 = __importDefault(require("./app/utils/logger"));
const server = http_1.default.createServer(app_1.default);
server.listen(config_1.config.port, () => {
    logger_1.default.info(`Server running on port ${config_1.config.port}`);
});
process.on('unhandledRejection', (err) => {
    logger_1.default.error('Unhandled Rejection:', err);
    server.close(() => {
        process.exit(1);
    });
});
process.on('SIGTERM', () => {
    logger_1.default.info('SIGTERM received. Shutting down gracefully');
    server.close(() => {
        logger_1.default.info('Process terminated');
    });
});
