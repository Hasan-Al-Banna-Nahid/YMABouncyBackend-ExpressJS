import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { IUser, IGoogleUser } from '../interfaces/user.interface';
import {
    signup,
    login,
    googleAuth,
    forgotPassword,
    resetPassword,
    updatePassword,
    protect,
} from '../services/auth.service';
import ApiError from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse';
import User from '../models/user.model';

type AuthenticatedRequest = Request & { user: IUser };

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    };
};

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, passwordConfirm } = req.body;
    const newUser = await signup(name, email, password, passwordConfirm);
    newUser.password = undefined;
    ApiResponse(res, 201, 'User registered successfully', { user: newUser });
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await login(email, password);
    const token = user.generateAuthToken();
    user.password = undefined;
    ApiResponse(res, 200, 'Logged in successfully', { token, user });
});

export const googleLogin = passport.authenticate('google', { scope: ['profile', 'email'] });

export const googleLoginCallback = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', { session: false }, async (err: Error, profile: IGoogleUser) => {
        try {
            if (err || !profile) throw new ApiError(err?.message || 'Google auth failed', 401);
            const user = await googleAuth(profile);
            const token = user.generateAuthToken();
            res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
        } catch (error) {
            next(error);
        }
    })(req, res, next);
};


export const forgotPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await forgotPassword(email);
    ApiResponse(res, 200, 'Token sent to email!');
});

export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
    const { token, password, passwordConfirm } = req.body;
    const user = await resetPassword(token, password, passwordConfirm);
    const authToken = user.generateAuthToken();
    ApiResponse(res, 200, 'Password reset successfully', { token: authToken });
});

export const updatePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
    const aReq = req as AuthenticatedRequest;

    if (!aReq.user || !aReq.user.id) {
        throw new ApiError('User not authenticated', 401);
    }

    const { currentPassword, newPassword, newPasswordConfirm } = req.body;

    const user = await updatePassword(
        aReq.user.id,
        currentPassword,
        newPassword,
        newPasswordConfirm
    );

    const token = user.generateAuthToken();
    ApiResponse(res, 200, 'Password updated successfully', { token });
});


export const protectRoute = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new ApiError('No token provided', 401);

    const currentUser = await protect(token); // should return IUser (Mongoose doc or plain object with id/role)
    (req as AuthenticatedRequest).user = currentUser;
    next();
});

export const restrictTo = (...roles: Array<IUser['role']>) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const aReq = req as Partial<AuthenticatedRequest>;
        if (!aReq.user || !roles.includes(aReq.user.role)) {
            throw new ApiError('Unauthorized', 403);
        }
        next();
    };
};

export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const aReq = req as AuthenticatedRequest;
    if (!aReq.user) throw new ApiError('User not authenticated', 401);

    const user = await User.findById(aReq.user.id);
    ApiResponse(res, 200, 'User retrieved successfully', { user });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
    const aReq = req as AuthenticatedRequest;
    if (!aReq.user) throw new ApiError('User not authenticated', 401);

    const { name, email, photo } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
        aReq.user.id,
        { name, email, photo },
        { new: true, runValidators: true }
    );
    ApiResponse(res, 200, 'User updated successfully', { user: updatedUser });
});

export const deleteMe = asyncHandler(async (req: Request, res: Response) => {
    const aReq = req as AuthenticatedRequest;
    if (!aReq.user) throw new ApiError('User not authenticated', 401);

    await User.findByIdAndUpdate(aReq.user.id, { active: false });
    ApiResponse(res, 204, 'User deleted successfully');
});
