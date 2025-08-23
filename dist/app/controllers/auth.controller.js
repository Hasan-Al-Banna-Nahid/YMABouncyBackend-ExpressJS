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
exports.protectRoute = exports.deleteMe = exports.updateMe = exports.getMe = exports.updatePasswordHandler = exports.resetPasswordHandler = exports.forgotPasswordHandler = exports.logout = exports.refreshToken = exports.loginUser = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const apiResponse_1 = require("../utils/apiResponse");
const user_model_1 = __importDefault(require("../models/user.model"));
const auth_service_1 = require("../services/auth.service");
const auth_util_1 = require("../utils/auth.util");
const cloudinary_util_1 = require("../utils/cloudinary.util");
const setAuthCookies = (res, accessToken, refreshToken) => {
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
exports.register = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, passwordConfirm } = req.body;
    const photo = req.file; // Multer adds the file to req.file
    const user = yield (0, auth_service_1.signup)(name, email, password, passwordConfirm, photo);
    const { accessToken, refreshToken } = yield (0, auth_util_1.issueTokens)(user);
    setAuthCookies(res, accessToken, refreshToken);
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
    const existingRefreshToken = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.refreshToken);
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
        setAuthCookies(res, rotated.accessToken, rotated.refreshToken);
        return (0, apiResponse_1.ApiResponse)(res, 200, "Token refreshed", {
            user: (0, auth_util_1.sanitizeUser)(user),
            tokens: rotated,
        });
    }
    // normal login
    const user = yield (0, auth_service_1.login)(email, password);
    const { accessToken, refreshToken } = yield (0, auth_util_1.issueTokens)(user);
    setAuthCookies(res, accessToken, refreshToken);
    (0, apiResponse_1.ApiResponse)(res, 200, "Logged in successfully", {
        user: (0, auth_util_1.sanitizeUser)(user),
        tokens: { accessToken, refreshToken },
    });
}));
/** POST /auth/refresh */
exports.refreshToken = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const token = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.refreshToken);
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
    setAuthCookies(res, rotated.accessToken, rotated.refreshToken);
    (0, apiResponse_1.ApiResponse)(res, 200, "Token refreshed", {
        user: (0, auth_util_1.sanitizeUser)(user),
        tokens: rotated,
    });
}));
/** POST /auth/logout */
exports.logout = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    let userId;
    const rt = ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.refreshToken);
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
    setAuthCookies(res, rotated.accessToken, rotated.refreshToken);
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
    setAuthCookies(res, rotated.accessToken, rotated.refreshToken);
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
    (0, apiResponse_1.ApiResponse)(res, 200, "User retrieved successfully", { user: (0, auth_util_1.sanitizeUser)(user) });
}));
/** PATCH /auth/me */
// src/controllers/auth.controller.ts
exports.updateMe = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const aReq = req;
    if (!aReq.user)
        throw new apiError_1.default("User not authenticated", 401);
    const { name, email } = req.body;
    const photo = req.file; // Multer adds the file to req.file
    let photoUrl;
    if (photo) {
        photoUrl = yield (0, cloudinary_util_1.uploadToCloudinary)(photo);
    }
    const updatedUser = yield user_model_1.default.findByIdAndUpdate(aReq.user.id, { name, email, photo: photoUrl || aReq.user.photo }, // Preserve existing photo if no new one
    { new: true, runValidators: true });
    if (!updatedUser)
        throw new apiError_1.default("User not found", 404);
    (0, apiResponse_1.ApiResponse)(res, 200, "User updated successfully", { user: (0, auth_util_1.sanitizeUser)(updatedUser) });
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
