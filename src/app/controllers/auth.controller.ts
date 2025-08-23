import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import User from "../models/user.model";
import { IUser } from "../interfaces/user.interface";
import {
    signup,
    login,
    forgotPassword,
    resetPassword,
    updatePassword,
    protect as verifyAccessTokenService,
} from "../services/auth.service";
import { issueTokens, sanitizeUser, hashToken } from "../utils/auth.util";
import {uploadToCloudinary,upload} from "../utils/cloudinary.util";

type AuthenticatedRequest = Request & { user: IUser };

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60, // up to you; JWT controls expiry anyway
    });
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30d
    });
};

/** POST /auth/register */
export const register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password, passwordConfirm } = req.body;
    const photo = req.file; // Multer adds the file to req.file

    const user = await signup(name, email, password, passwordConfirm, photo);
    const { accessToken, refreshToken } = await issueTokens(user);
    setAuthCookies(res, accessToken, refreshToken);
    ApiResponse(res, 201, "User registered successfully", {
        user: sanitizeUser(user),
        tokens: { accessToken, refreshToken },
    });
});
/** POST /auth/login */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // try rotate if refresh present
    const existingRefreshToken =
        ((req as any).cookies?.refreshToken as string | undefined) || req.body?.refreshToken;

    if (existingRefreshToken) {
        const payload = jwt.verify(
            existingRefreshToken,
            process.env.JWT_REFRESH_SECRET!
        ) as any;

        const user = await User.findById(payload.id).select(
            "+refreshTokenHash +refreshTokenExpiresAt"
        );
        if (!user) throw new ApiError("Invalid refresh token", 401);

        const matches = user.refreshTokenHash === hashToken(existingRefreshToken);
        const notExpired =
            !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt > new Date();
        if (!matches || !notExpired) throw new ApiError("Invalid/expired refresh token", 401);

        const rotated = await issueTokens(user);
        setAuthCookies(res, rotated.accessToken, rotated.refreshToken);

        return ApiResponse(res, 200, "Token refreshed", {
            user: sanitizeUser(user),
            tokens: rotated,
        });
    }

    // normal login
    const user = await login(email, password);
    const { accessToken, refreshToken } = await issueTokens(user);
    setAuthCookies(res, accessToken, refreshToken);
    ApiResponse(res, 200, "Logged in successfully", {
        user: sanitizeUser(user),
        tokens: { accessToken, refreshToken },
    });
});

/** POST /auth/refresh */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const token =
        ((req as any).cookies?.refreshToken as string | undefined) || req.body?.refreshToken;
    if (!token) throw new ApiError("Refresh token required", 401);

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
    const user = await User.findById(payload.id).select(
        "+refreshTokenHash +refreshTokenExpiresAt"
    );
    if (!user) throw new ApiError("Invalid refresh token", 401);

    const matches = user.refreshTokenHash === hashToken(token);
    const notExpired =
        !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt > new Date();
    if (!matches || !notExpired) throw new ApiError("Invalid/expired refresh token", 401);

    const rotated = await issueTokens(user);
    setAuthCookies(res, rotated.accessToken, rotated.refreshToken);
    ApiResponse(res, 200, "Token refreshed", {
        user: sanitizeUser(user),
        tokens: rotated,
    });
});

/** POST /auth/logout */
export const logout = asyncHandler(async (req: Request, res: Response) => {
    let userId: string | undefined;

    const rt =
        ((req as any).cookies?.refreshToken as string | undefined) || req.body?.refreshToken;
    if (rt) {
        try {
            const payload = jwt.verify(rt, process.env.JWT_REFRESH_SECRET!) as any;
            userId = payload?.id;
        } catch {}
    }

    if (!userId) {
        const headerToken = req.headers.authorization?.startsWith("Bearer ")
            ? req.headers.authorization.split(" ")[1]
            : undefined;
        const cookieAT = (req as any).cookies?.accessToken as string | undefined;
        const at = headerToken || cookieAT;
        if (at) {
            try {
                const payload = jwt.verify(at, process.env.JWT_SECRET!) as any;
                userId = payload?.id;
            } catch {}
        }
    }

    if (!userId && (req as any).user?.id) userId = (req as any).user.id;

    if (userId) {
        const user = await User.findById(userId).select(
            "+refreshTokenHash +refreshTokenExpiresAt"
        );
        if (user) {
            user.refreshTokenHash = undefined as any;
            user.refreshTokenExpiresAt = undefined as any;
            await user.save({ validateBeforeSave: false });
        }
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    ApiResponse(res, 200, "Logged out", {});
});

/** POST /auth/forgot-password */
export const forgotPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    await forgotPassword(email);
    ApiResponse(res, 200, "Token sent to email!");
});

/** POST /auth/reset-password */
export const resetPasswordHandler = asyncHandler(async (req: Request, res: Response) => {
    const { token, password, passwordConfirm } = req.body;
    const user = await resetPassword(token, password, passwordConfirm);

    // rotate tokens on reset
    const rotated = await issueTokens(user);
    setAuthCookies(res, rotated.accessToken, rotated.refreshToken);

    ApiResponse(res, 200, "Password reset successfully", {
        user: sanitizeUser(user),
        tokens: rotated,
    });
});

/** PATCH /auth/update-password */
export const updatePasswordHandler = asyncHandler(async (req: Request, res: Response) => {
    const aReq = req as AuthenticatedRequest;
    if (!aReq.user?.id) throw new ApiError("User not authenticated", 401);

    const { currentPassword, newPassword, newPasswordConfirm } = req.body;
    const user = await updatePassword(
        aReq.user.id,
        currentPassword,
        newPassword,
        newPasswordConfirm
    );

    // rotate tokens after password change + nuke old refresh
    user.refreshTokenHash = undefined as any;
    user.refreshTokenExpiresAt = undefined as any;
    await user.save({ validateBeforeSave: false });

    const rotated = await issueTokens(user);
    setAuthCookies(res, rotated.accessToken, rotated.refreshToken);

    ApiResponse(res, 200, "Password updated successfully", {
        user: sanitizeUser(user),
        tokens: rotated,
    });
});

/** GET /auth/me */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const aReq = req as AuthenticatedRequest;
    if (!aReq.user) throw new ApiError("User not authenticated", 401);

    const user = await User.findById(aReq.user.id);
    ApiResponse(res, 200, "User retrieved successfully", { user: sanitizeUser(user) });
});

/** PATCH /auth/me */
// src/controllers/auth.controller.ts
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
    const aReq = req as AuthenticatedRequest;
    if (!aReq.user) throw new ApiError("User not authenticated", 401);

    const { name, email } = req.body;
    const photo = req.file; // Multer adds the file to req.file

    let photoUrl: string | undefined;
    if (photo) {
        photoUrl = await uploadToCloudinary(photo);
    }

    const updatedUser = await User.findByIdAndUpdate(
        aReq.user.id,
        { name, email, photo: photoUrl || aReq.user.photo }, // Preserve existing photo if no new one
        { new: true, runValidators: true }
    );
    if (!updatedUser) throw new ApiError("User not found", 404);

    ApiResponse(res, 200, "User updated successfully", { user: sanitizeUser(updatedUser) });
});
/** DELETE /auth/me (soft delete + return updated user) */
export const deleteMe = asyncHandler(async (req: Request, res: Response) => {
    const aReq = req as AuthenticatedRequest;
    if (!aReq.user) throw new ApiError("User not authenticated", 401);

    const updatedUser = await User.findByIdAndUpdate(
        aReq.user.id,
        { active: false },
        { new: true }
    );
    if (!updatedUser) throw new ApiError("User not found", 404);

    // Optional: clear tokens and invalidate refresh
    updatedUser.refreshTokenHash = undefined as any;
    updatedUser.refreshTokenExpiresAt = undefined as any;
    await updatedUser.save({ validateBeforeSave: false });
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    ApiResponse(res, 200, "User deactivated successfully", {
        user: sanitizeUser(updatedUser),
    });
});

/** helper if you need it elsewhere (middleware style) */
export const protectRoute = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const headerToken = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined;
    const cookieToken = (req as any).cookies?.accessToken as string | undefined;
    const token = headerToken || cookieToken;
    if (!token) throw new ApiError("No token provided", 401);

    const currentUser = await verifyAccessTokenService(token);
    (req as AuthenticatedRequest).user = currentUser;
    next();
});
