import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { IUser } from "../interfaces/user.interface";
import User from "../models/user.model";
import {
  forgotPassword,
  login,
  resetPassword,
  signup,
  updatePassword,
  protect as verifyAccessTokenService,
} from "../services/auth.service";
import ApiError from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import { hashToken, issueTokens, sanitizeUser } from "../utils/auth.util";
import { uploadToCloudinary } from "../utils/cloudinary.util";

type AuthenticatedRequest = Request & { user: IUser };

// helpers/cookies.ts
const setAuthCookies = (res: Response, access: string, refresh: string) => {
  res.cookie("accessToken", access, {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    partitioned: true, // ⭐ allow 3rd-party cookie in modern Chrome
    path: "/",
    maxAge: 60 * 60 * 1000,
  });
  res.cookie("refreshToken", refresh, {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    partitioned: true, // ⭐
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
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
    ((req as any).cookies?.refreshToken as string | undefined) ||
    req.body?.refreshToken;

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
    if (!matches || !notExpired)
      throw new ApiError("Invalid/expired refresh token", 401);

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
export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const token =
      ((req as any).cookies?.refreshToken as string | undefined) ||
      req.body?.refreshToken;
    if (!token) throw new ApiError("Refresh token required", 401);

    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
    const user = await User.findById(payload.id).select(
      "+refreshTokenHash +refreshTokenExpiresAt"
    );
    if (!user) throw new ApiError("Invalid refresh token", 401);

    const matches = user.refreshTokenHash === hashToken(token);
    const notExpired =
      !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt > new Date();
    if (!matches || !notExpired)
      throw new ApiError("Invalid/expired refresh token", 401);

    const rotated = await issueTokens(user);
    setAuthCookies(res, rotated.accessToken, rotated.refreshToken);
    ApiResponse(res, 200, "Token refreshed", {
      user: sanitizeUser(user),
      tokens: rotated,
    });
  }
);

/** POST /auth/logout */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  let userId: string | undefined;

  const rt =
    ((req as any).cookies?.refreshToken as string | undefined) ||
    req.body?.refreshToken;
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
export const forgotPasswordHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    await forgotPassword(email);
    ApiResponse(res, 200, "Token sent to email!");
  }
);

/** POST /auth/reset-password */
export const resetPasswordHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, password, passwordConfirm } = req.body;
    const user = await resetPassword(token, password, passwordConfirm);

    // rotate tokens on reset
    const rotated = await issueTokens(user);
    setAuthCookies(res, rotated.accessToken, rotated.refreshToken);

    ApiResponse(res, 200, "Password reset successfully", {
      user: sanitizeUser(user),
      tokens: rotated,
    });
  }
);

/** PATCH /auth/update-password */
export const updatePasswordHandler = asyncHandler(
  async (req: Request, res: Response) => {
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
  }
);

/** GET /auth/me */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const aReq = req as AuthenticatedRequest;
  if (!aReq.user) throw new ApiError("User not authenticated", 401);

  const user = await User.findById(aReq.user.id);
  ApiResponse(res, 200, "User retrieved successfully", {
    user: sanitizeUser(user),
  });
});

/** PATCH /auth/me */
// src/controllers/auth.controller.ts
// controllers/auth.controller.ts

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const aReq = req as AuthenticatedRequest;
  if (!aReq.user) throw new ApiError("User not authenticated", 401);

  // ----------- Parse inputs -----------
  const { name, email, currentPassword, newPassword, newPasswordConfirm } =
    req.body as {
      name?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
      newPasswordConfirm?: string;
    };
  const file = req.file; // Multer memoryStorage -> req.file.buffer

  // ----------- Handle photo (optional) -----------
  let photoUrl: string | undefined;
  if (file) {
    // If you want stable public_id per user, pass aReq.user.id
    photoUrl = await uploadToCloudinary(file);
    // cache-bust the url so clients see it immediately
    const ts = Date.now();
    photoUrl = `${photoUrl}${photoUrl.includes("?") ? "&" : "?"}t=${ts}`;
  }

  // ----------- Build partial update for profile fields -----------
  // (Only include fields that were provided; don't overwrite with undefined)
  const profileUpdate: Record<string, any> = {};
  if (typeof name !== "undefined") profileUpdate.name = name;

  if (typeof email !== "undefined") {
    const normalizedEmail = String(email).trim().toLowerCase();
    // Ensure email not taken by someone else
    const exists = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: aReq.user.id },
    });
    if (exists) throw new ApiError("Email already in use", 400);
    profileUpdate.email = normalizedEmail;
  }

  if (typeof photoUrl !== "undefined") {
    profileUpdate.photo = photoUrl;
  }

  // We will update profile first, *unless* we need to change password as well.
  // (Doing profile first or after password doesn’t matter; keeping it simple.)

  // ----------- If password change requested, validate & change -----------
  const wantsPasswordChange =
    typeof currentPassword !== "undefined" ||
    typeof newPassword !== "undefined" ||
    typeof newPasswordConfirm !== "undefined";

  let userDoc = await User.findById(aReq.user.id).select(
    "+password +refreshTokenHash +refreshTokenExpiresAt"
  );
  if (!userDoc) throw new ApiError("User not found", 404);

  // Apply profile updates to the user doc now (so single save covers both)
  Object.assign(userDoc, profileUpdate);

  let rotatedTokens: { accessToken: string; refreshToken: string } | undefined;

  if (wantsPasswordChange) {
    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      throw new ApiError(
        "To change password, provide currentPassword, newPassword and newPasswordConfirm.",
        400
      );
    }

    if (!userDoc.password) throw new ApiError("User has no password set", 400);

    const ok = await userDoc.correctPassword(currentPassword, userDoc.password);
    if (!ok) throw new ApiError("Your current password is wrong.", 401);

    if (newPassword !== newPasswordConfirm)
      throw new ApiError("Passwords do not match", 400);

    // Set new password -> pre('save') will hash it
    userDoc.password = newPassword;

    // Invalidate any existing refresh token
    userDoc.refreshTokenHash = undefined as any;
    userDoc.refreshTokenExpiresAt = undefined as any;

    // Save once to run validators + hashing
    await userDoc.save();

    // Rotate tokens after password change
    rotatedTokens = await issueTokens(userDoc);
    setAuthCookies(res, rotatedTokens.accessToken, rotatedTokens.refreshToken);
  } else {
    // No password change: just persist profile changes if there are any
    if (Object.keys(profileUpdate).length > 0) {
      await userDoc.save({ validateModifiedOnly: true });
    }
  }

  // Re-fetch a clean user to return (or sanitize userDoc)
  const safe = sanitizeUser(userDoc);

  ApiResponse(res, 200, "User updated successfully", {
    user: safe,
    // Only include tokens if password was rotated; otherwise omit for clarity
    ...(rotatedTokens ? { tokens: rotatedTokens } : {}),
  });
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
export const protectRoute = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const headerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined;
    const cookieToken = (req as any).cookies?.accessToken as string | undefined;
    const token = headerToken || cookieToken;
    if (!token) throw new ApiError("No token provided", 401);

    const currentUser = await verifyAccessTokenService(token);
    (req as AuthenticatedRequest).user = currentUser;
    next();
  }
);
export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
};
