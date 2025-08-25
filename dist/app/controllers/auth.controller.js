"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAuthCookies = exports.protectRoute = exports.deleteMe = exports.updateMe = exports.getMe = exports.updatePasswordHandler = exports.resetPasswordHandler = exports.forgotPasswordHandler = exports.logout = exports.refreshToken = exports.loginUser = exports.register = exports.setAuthCookies = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const auth_service_1 = require("../services/auth.service");
const apiError_1 = __importDefault(require("../utils/apiError"));
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const auth_util_1 = require("../utils/auth.util");
const cloudinary_util_1 = require("../utils/cloudinary.util");
// helpers/cookies.ts
const setAuthCookies = (res, accessToken, refreshToken) => {
    const isProd = process.env.NODE_ENV === "production";
    // Access token cookie (optional): you *can* skip setting this and only return access in JSON.
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true, // required when SameSite=None
        sameSite: "none", // cross-site
        path: "/",
        maxAge: 60 * 60 * 1000, // 1h
    });
    // Refresh token cookie (HttpOnly)
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/", // or restrict e.g. "/api/v1/auth"
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30d
    });
};
exports.setAuthCookies = setAuthCookies;
/** POST /auth/register */
exports.register = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, passwordConfirm } = req.body;
    const photo = req.file; // Multer adds the file to req.file
    const user = yield (0, auth_service_1.signup)(name, email, password, passwordConfirm, photo);
    const { accessToken, refreshToken } = yield (0, auth_util_1.issueTokens)(user);
    (0, exports.setAuthCookies)(res, accessToken, refreshToken);
    (0, apiResponse_1.ApiResponse)(res, 201, "User registered successfully", {
        user: (0, auth_util_1.sanitizeUser)(user),
        tokens: { accessToken, refreshToken },
    });
}));
/** POST /auth/login */
exports.loginUser = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { email, password } = req.body;
    // try rotate if refresh present
    const existingRefreshToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken) ||
        ((_b = req.body) === null || _b === void 0 ? void 0 : _b.refreshToken);
    if (existingRefreshToken) {
        const payload = jsonwebtoken_1.default.verify(existingRefreshToken, process.env.JWT_REFRESH_SECRET);
        const user = yield user_model_1.default.findById(payload.id).select("+refreshTokenHash +refreshTokenExpiresAt");
        if (!user)
            throw new apiError_1.default("Invalid refresh token", 401);
        const matches = user.refreshTokenHash === (0, auth_util_1.hashToken)(existingRefreshToken);
        const notExpired = !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt > new Date();
        if (!matches || !notExpired)
            throw new apiError_1.default("Invalid/expired refresh token", 401);
        const rotated = yield (0, auth_util_1.issueTokens)(user);
        (0, exports.setAuthCookies)(res, rotated.accessToken, rotated.refreshToken);
        return (0, apiResponse_1.ApiResponse)(res, 200, "Token refreshed", {
            user: (0, auth_util_1.sanitizeUser)(user),
            tokens: rotated,
        });
    }
    // normal login
    const user = yield (0, auth_service_1.login)(email, password);
    const { accessToken, refreshToken } = yield (0, auth_util_1.issueTokens)(user);
    (0, exports.setAuthCookies)(res, accessToken, refreshToken);
    (0, apiResponse_1.ApiResponse)(res, 200, "Logged in successfully", {
        user: (0, auth_util_1.sanitizeUser)(user),
        tokens: { accessToken, refreshToken },
    });
}));
/** POST /auth/refresh */
exports.refreshToken = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken) ||
        ((_b = req.body) === null || _b === void 0 ? void 0 : _b.refreshToken);
    if (!token)
        throw new apiError_1.default("Refresh token required", 401);
    const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = yield user_model_1.default.findById(payload.id).select("+refreshTokenHash +refreshTokenExpiresAt");
    if (!user)
        throw new apiError_1.default("Invalid refresh token", 401);
    const matches = user.refreshTokenHash === (0, auth_util_1.hashToken)(token);
    const notExpired = !user.refreshTokenExpiresAt || user.refreshTokenExpiresAt > new Date();
    if (!matches || !notExpired)
        throw new apiError_1.default("Invalid/expired refresh token", 401);
    const rotated = yield (0, auth_util_1.issueTokens)(user);
    (0, exports.setAuthCookies)(res, rotated.accessToken, rotated.refreshToken);
    (0, apiResponse_1.ApiResponse)(res, 200, "Token refreshed", {
        user: (0, auth_util_1.sanitizeUser)(user),
        tokens: rotated,
    });
}));
/** POST /auth/logout */
exports.logout = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    let userId;
    const rt = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken) ||
        ((_b = req.body) === null || _b === void 0 ? void 0 : _b.refreshToken);
    if (rt) {
        try {
            const payload = jsonwebtoken_1.default.verify(rt, process.env.JWT_REFRESH_SECRET);
            userId = payload === null || payload === void 0 ? void 0 : payload.id;
        }
        catch (_f) { }
    }
    if (!userId) {
        const headerToken = ((_c = req.headers.authorization) === null || _c === void 0 ? void 0 : _c.startsWith("Bearer "))
            ? req.headers.authorization.split(" ")[1]
            : undefined;
        const cookieAT = (_d = req.cookies) === null || _d === void 0 ? void 0 : _d.accessToken;
        const at = headerToken || cookieAT;
        if (at) {
            try {
                const payload = jsonwebtoken_1.default.verify(at, process.env.JWT_SECRET);
                userId = payload === null || payload === void 0 ? void 0 : payload.id;
            }
            catch (_g) { }
        }
    }
    if (!userId && ((_e = req.user) === null || _e === void 0 ? void 0 : _e.id))
        userId = req.user.id;
    if (userId) {
        const user = yield user_model_1.default.findById(userId).select("+refreshTokenHash +refreshTokenExpiresAt");
        if (user) {
            user.refreshTokenHash = undefined;
            user.refreshTokenExpiresAt = undefined;
            yield user.save({ validateBeforeSave: false });
        }
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    (0, apiResponse_1.ApiResponse)(res, 200, "Logged out", {});
}));
/** POST /auth/forgot-password */
exports.forgotPasswordHandler = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    yield (0, auth_service_1.forgotPassword)(email);
    (0, apiResponse_1.ApiResponse)(res, 200, "Token sent to email!");
}));
/** POST /auth/reset-password */
exports.resetPasswordHandler = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token, password, passwordConfirm } = req.body;
    const user = yield (0, auth_service_1.resetPassword)(token, password, passwordConfirm);
    // rotate tokens on reset
    const rotated = yield (0, auth_util_1.issueTokens)(user);
    (0, exports.setAuthCookies)(res, rotated.accessToken, rotated.refreshToken);
    (0, apiResponse_1.ApiResponse)(res, 200, "Password reset successfully", {
        user: (0, auth_util_1.sanitizeUser)(user),
        tokens: rotated,
    });
}));
/** PATCH /auth/update-password */
exports.updatePasswordHandler = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const aReq = req;
    if (!((_a = aReq.user) === null || _a === void 0 ? void 0 : _a.id))
        throw new apiError_1.default("User not authenticated", 401);
    const { currentPassword, newPassword, newPasswordConfirm } = req.body;
    const user = yield (0, auth_service_1.updatePassword)(aReq.user.id, currentPassword, newPassword, newPasswordConfirm);
    // rotate tokens after password change + nuke old refresh
    user.refreshTokenHash = undefined;
    user.refreshTokenExpiresAt = undefined;
    yield user.save({ validateBeforeSave: false });
    const rotated = yield (0, auth_util_1.issueTokens)(user);
    (0, exports.setAuthCookies)(res, rotated.accessToken, rotated.refreshToken);
    (0, apiResponse_1.ApiResponse)(res, 200, "Password updated successfully", {
        user: (0, auth_util_1.sanitizeUser)(user),
        tokens: rotated,
    });
}));
/** GET /auth/me */
exports.getMe = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const aReq = req;
    if (!aReq.user)
        throw new apiError_1.default("User not authenticated", 401);
    const user = yield user_model_1.default.findById(aReq.user.id);
    (0, apiResponse_1.ApiResponse)(res, 200, "User retrieved successfully", {
        user: (0, auth_util_1.sanitizeUser)(user),
    });
}));
/** PATCH /auth/me */
// src/controllers/auth.controller.ts
// controllers/auth.controller.ts
exports.updateMe = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const aReq = req;
    if (!aReq.user)
        throw new apiError_1.default("User not authenticated", 401);
    // ----------- Parse inputs -----------
    const { name, email, currentPassword, newPassword, newPasswordConfirm } = req.body;
    const file = req.file; // Multer memoryStorage -> req.file.buffer
    // ----------- Handle photo (optional) -----------
    let photoUrl;
    if (file) {
        // If you want stable public_id per user, pass aReq.user.id
        photoUrl = yield (0, cloudinary_util_1.uploadToCloudinary)(file);
        // cache-bust the url so clients see it immediately
        const ts = Date.now();
        photoUrl = `${photoUrl}${photoUrl.includes("?") ? "&" : "?"}t=${ts}`;
    }
    // ----------- Build partial update for profile fields -----------
    // (Only include fields that were provided; don't overwrite with undefined)
    const profileUpdate = {};
    if (typeof name !== "undefined")
        profileUpdate.name = name;
    if (typeof email !== "undefined") {
        const normalizedEmail = String(email).trim().toLowerCase();
        // Ensure email not taken by someone else
        const exists = yield user_model_1.default.findOne({
            email: normalizedEmail,
            _id: { $ne: aReq.user.id },
        });
        if (exists)
            throw new apiError_1.default("Email already in use", 400);
        profileUpdate.email = normalizedEmail;
    }
    if (typeof photoUrl !== "undefined") {
        profileUpdate.photo = photoUrl;
    }
    // We will update profile first, *unless* we need to change password as well.
    // (Doing profile first or after password doesn’t matter; keeping it simple.)
    // ----------- If password change requested, validate & change -----------
    const wantsPasswordChange = typeof currentPassword !== "undefined" ||
        typeof newPassword !== "undefined" ||
        typeof newPasswordConfirm !== "undefined";
    let userDoc = yield user_model_1.default.findById(aReq.user.id).select("+password +refreshTokenHash +refreshTokenExpiresAt");
    if (!userDoc)
        throw new apiError_1.default("User not found", 404);
    // Apply profile updates to the user doc now (so single save covers both)
    Object.assign(userDoc, profileUpdate);
    let rotatedTokens;
    if (wantsPasswordChange) {
        if (!currentPassword || !newPassword || !newPasswordConfirm) {
            throw new apiError_1.default("To change password, provide currentPassword, newPassword and newPasswordConfirm.", 400);
        }
        if (!userDoc.password)
            throw new apiError_1.default("User has no password set", 400);
        const ok = yield userDoc.correctPassword(currentPassword, userDoc.password);
        if (!ok)
            throw new apiError_1.default("Your current password is wrong.", 401);
        if (newPassword !== newPasswordConfirm)
            throw new apiError_1.default("Passwords do not match", 400);
        // Set new password -> pre('save') will hash it
        userDoc.password = newPassword;
        // Invalidate any existing refresh token
        userDoc.refreshTokenHash = undefined;
        userDoc.refreshTokenExpiresAt = undefined;
        // Save once to run validators + hashing
        yield userDoc.save();
        // Rotate tokens after password change
        rotatedTokens = yield (0, auth_util_1.issueTokens)(userDoc);
        (0, exports.setAuthCookies)(res, rotatedTokens.accessToken, rotatedTokens.refreshToken);
    }
    else {
        // No password change: just persist profile changes if there are any
        if (Object.keys(profileUpdate).length > 0) {
            yield userDoc.save({ validateModifiedOnly: true });
        }
    }
    // Re-fetch a clean user to return (or sanitize userDoc)
    const safe = (0, auth_util_1.sanitizeUser)(userDoc);
    (0, apiResponse_1.ApiResponse)(res, 200, "User updated successfully", Object.assign({ user: safe }, (rotatedTokens ? { tokens: rotatedTokens } : {})));
}));
/** DELETE /auth/me (soft delete + return updated user) */
exports.deleteMe = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const aReq = req;
    if (!aReq.user)
        throw new apiError_1.default("User not authenticated", 401);
    const updatedUser = yield user_model_1.default.findByIdAndUpdate(aReq.user.id, { active: false }, { new: true });
    if (!updatedUser)
        throw new apiError_1.default("User not found", 404);
    // Optional: clear tokens and invalidate refresh
    updatedUser.refreshTokenHash = undefined;
    updatedUser.refreshTokenExpiresAt = undefined;
    yield updatedUser.save({ validateBeforeSave: false });
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    (0, apiResponse_1.ApiResponse)(res, 200, "User deactivated successfully", {
        user: (0, auth_util_1.sanitizeUser)(updatedUser),
    });
}));
/** helper if you need it elsewhere (middleware style) */
exports.protectRoute = (0, asyncHandler_1.default)((req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const headerToken = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.startsWith("Bearer "))
        ? req.headers.authorization.split(" ")[1]
        : undefined;
    const cookieToken = (_b = req.cookies) === null || _b === void 0 ? void 0 : _b.accessToken;
    const token = headerToken || cookieToken;
    if (!token)
        throw new apiError_1.default("No token provided", 401);
    const currentUser = yield (0, auth_service_1.protect)(token);
    req.user = currentUser;
    next();
}));
const clearAuthCookies = (res) => {
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
exports.clearAuthCookies = clearAuthCookies;
