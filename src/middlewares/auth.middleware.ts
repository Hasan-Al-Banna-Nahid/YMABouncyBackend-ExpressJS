import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ApiError from '../utils/apiError';
import { IUser } from '../interfaces/user.interface';
import User from '../models/user.model';

// Extend Express Request interface to include user
interface AuthRequest extends Request {
    user?: IUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // 1) Getting token and check if it's there
        let token: string | undefined;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            throw new ApiError('You are not logged in! Please log in to get access.', 401);
        }

        // 2) Verification token
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new ApiError('JWT secret is not configured', 500);
        }

        const decoded = jwt.verify(token, jwtSecret) as { id: string; iat: number };

        // 3) Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            throw new ApiError('The user belonging to this token no longer exists.', 401);
        }

        // 4) Check if user changed password after the token was issued
        if (currentUser.passwordChangedAt && currentUser.changedPasswordAfter(decoded.iat)) {
            throw new ApiError('User recently changed password! Please log in again.', 401);
        }

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = currentUser;
        next();
    } catch (err) {
        next(err);
    }
};

export const restrictTo = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !req.user.role) {
            throw new ApiError('User not found or role not assigned', 404);
        }
        if (!roles.includes(req.user.role)) {
            throw new ApiError('You do not have permission to perform this action', 403);
        }

        next();
    };
};