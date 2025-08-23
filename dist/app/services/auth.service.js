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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = exports.updatePassword = exports.resetPassword = exports.forgotPassword = exports.login = exports.signup = exports.createSendToken = exports.signToken = void 0;
// src/services/auth.service.ts
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = __importDefault(require("../models/user.model"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const email_service_1 = require("./email.service");
// ----- JWT config (typed) -----
const JWT_SECRET_ENV = process.env.JWT_SECRET;
if (!JWT_SECRET_ENV)
    throw new Error("JWT_SECRET is not defined");
const JWT_SECRET = JWT_SECRET_ENV;
const JWT_EXPIRES_IN = (_a = process.env.JWT_EXPIRES_IN) !== null && _a !== void 0 ? _a : "15m";
// ----- helpers (optional) -----
const signToken = (id) => jsonwebtoken_1.default.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
exports.signToken = signToken;
const createSendToken = (user, statusCode, _req, res) => {
    const token = (0, exports.signToken)(user._id.toString());
    res.status(statusCode).json({
        status: "success",
        token,
        data: { user },
    });
};
exports.createSendToken = createSendToken;
// ----- auth flows -----
const signup = (name, email, password, passwordConfirm) => __awaiter(void 0, void 0, void 0, function* () {
    if (password !== passwordConfirm)
        throw new apiError_1.default("Passwords do not match", 400);
    const existingUser = yield user_model_1.default.findOne({ email });
    if (existingUser)
        throw new apiError_1.default("Email already in use", 400);
    const newUser = yield user_model_1.default.create({ name, email, password }); // pre-save hook hashes
    return newUser;
});
exports.signup = signup;
const login = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    if (!email || !password)
        throw new apiError_1.default("Please provide email and password", 400);
    const user = yield user_model_1.default.findOne({ email }).select("+password +refreshTokenHash +refreshTokenExpiresAt");
    if (!user || !user.password)
        throw new apiError_1.default("Incorrect email or password", 401);
    const ok = yield user.correctPassword(password, user.password);
    if (!ok)
        throw new apiError_1.default("Incorrect email or password", 401);
    return user;
});
exports.login = login;
const forgotPassword = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findOne({ email });
    if (!user)
        throw new apiError_1.default("There is no user with that email address.", 404);
    const resetToken = user.createPasswordResetToken();
    yield user.save({ validateBeforeSave: false });
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    try {
        yield (0, email_service_1.sendEmail)({
            email: user.email,
            subject: "Your password reset token (valid for 10 min)",
            template: "passwordReset",
            templateVars: { name: user.name, resetURL },
        });
        return resetToken;
    }
    catch (_a) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        yield user.save({ validateBeforeSave: false });
        throw new apiError_1.default("There was an error sending the email. Try again later!", 500);
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (token, password, passwordConfirm) => __awaiter(void 0, void 0, void 0, function* () {
    const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
    const user = yield user_model_1.default.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if (!user)
        throw new apiError_1.default("Token is invalid or has expired", 400);
    if (password !== passwordConfirm)
        throw new apiError_1.default("Passwords do not match", 400);
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    yield user.save();
    return user;
});
exports.resetPassword = resetPassword;
const updatePassword = (userId, currentPassword, newPassword, newPasswordConfirm) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findById(userId).select("+password +refreshTokenHash +refreshTokenExpiresAt");
    if (!user)
        throw new apiError_1.default("User not found", 404);
    if (!user.password)
        throw new apiError_1.default("User has no password set", 400);
    const ok = yield user.correctPassword(currentPassword, user.password);
    if (!ok)
        throw new apiError_1.default("Your current password is wrong.", 401);
    if (newPassword !== newPasswordConfirm)
        throw new apiError_1.default("Passwords do not match", 400);
    user.password = newPassword;
    // Optional extra safety: invalidate any existing refresh
    user.refreshTokenHash = undefined;
    user.refreshTokenExpiresAt = undefined;
    yield user.save();
    return user;
});
exports.updatePassword = updatePassword;
const protect = (token) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token)
        throw new apiError_1.default("You are not logged in! Please log in to get access.", 401);
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (_a) {
        throw new apiError_1.default("Invalid token. Please log in again!", 401);
    }
    if (!decoded || typeof decoded !== "object" || !decoded.id || typeof decoded.iat !== "number") {
        throw new apiError_1.default("Invalid token payload.", 401);
    }
    const currentUser = yield user_model_1.default.findById(decoded.id).select("+role"); // Explicitly include role
    if (!currentUser)
        throw new apiError_1.default("The user belonging to this token does no longer exist.", 401);
    if (currentUser.active === false) {
        throw new apiError_1.default("Account is deactivated.", 401);
    }
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        throw new apiError_1.default("User recently changed password! Please log in again.", 401);
    }
    return currentUser;
});
exports.protect = protect;
