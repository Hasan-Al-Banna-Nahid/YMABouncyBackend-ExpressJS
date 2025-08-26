import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/apiError';

export const errorConverter = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (!(err instanceof ApiError)) {
        const statusCode = err.statusCode || 500;
        const message = err.message || 'Internal Server Error';
        err = new ApiError(message, statusCode, err.stack);
    }
    next(err);
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
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

export const notFound = (req: Request, res: Response, next: NextFunction) => {
    next(new ApiError('Not found', 404));
};