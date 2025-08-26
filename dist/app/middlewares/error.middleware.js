"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = exports.errorHandler = exports.errorConverter = void 0;
const apiError_1 = __importDefault(require("../utils/apiError"));
const errorConverter = (err, req, res, next) => {
    if (!(err instanceof apiError_1.default)) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Internal Server Error';
        err = new apiError_1.default(message, statusCode, err.stack);
    }
    next(err);
};
exports.errorConverter = errorConverter;
const errorHandler = (err, req, res, next) => {
    const { statusCode, message } = err;
    res.locals.errorMessage = err.message;
    const response = {
        status: statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };
    if (process.env.NODE_ENV === 'development') {
        console.error(err);
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
const notFound = (req, res, next) => {
    next(new apiError_1.default('Not found', 404));
};
exports.notFound = notFound;
