// src/services/auth.service.ts
import dotenv from "dotenv";
dotenv.config();

import jwt, { JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { Request } from "express";
import { IUser } from "../interfaces/user.interface";
import User from "../models/user.model";
import ApiError from "../utils/apiError";
import { sendEmail } from "./email.service";

// ----- JWT config (typed) -----
const JWT_SECRET_ENV = process.env.JWT_SECRET;
if (!JWT_SECRET_ENV) throw new Error("JWT_SECRET is not defined");
const JWT_SECRET: Secret = JWT_SECRET_ENV;

const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
    ((process.env.JWT_EXPIRES_IN as unknown) as SignOptions["expiresIn"]) ?? "15m";

// ----- helpers (optional) -----
export const signToken = (id: string): string =>
    jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const createSendToken = (user: IUser, statusCode: number, _req: Request, res: any) => {
    const token = signToken(user._id.toString());
    res.status(statusCode).json({
        status: "success",
        token,
        data: { user },
    });
};

// ----- auth flows -----
export const signup = async (name: string, email: string, password: string, passwordConfirm: string) => {
    if (password !== passwordConfirm) throw new ApiError("Passwords do not match", 400);

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new ApiError("Email already in use", 400);

    const newUser = await User.create({ name, email, password }); // pre-save hook hashes
    return newUser;
};

export const login = async (email: string, password: string) => {
    if (!email || !password) throw new ApiError("Please provide email and password", 400);

    const user = await User.findOne({ email }).select("+password +refreshTokenHash +refreshTokenExpiresAt");
    if (!user || !user.password) throw new ApiError("Incorrect email or password", 401);

    const ok = await user.correctPassword(password, user.password);
    if (!ok) throw new ApiError("Incorrect email or password", 401);

    return user;
};

export const forgotPassword = async (email: string) => {
    const user = await User.findOne({ email });
    if (!user) throw new ApiError("There is no user with that email address.", 404);

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
        await sendEmail({
            email: user.email,
            subject: "Your password reset token (valid for 10 min)",
            template: "passwordReset",
            templateVars: { name: user.name, resetURL },
        });
        return resetToken;
    } catch {
        user.passwordResetToken = undefined as any;
        user.passwordResetExpires = undefined as any;
        await user.save({ validateBeforeSave: false });
        throw new ApiError("There was an error sending the email. Try again later!", 500);
    }
};

export const resetPassword = async (token: string, password: string, passwordConfirm: string) => {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) throw new ApiError("Token is invalid or has expired", 400);

    if (password !== passwordConfirm) throw new ApiError("Passwords do not match", 400);

    user.password = password;
    user.passwordResetToken = undefined as any;
    user.passwordResetExpires = undefined as any;
    await user.save();

    return user;
};

export const updatePassword = async (
    userId: string,
    currentPassword: string,
    newPassword: string,
    newPasswordConfirm: string
) => {
    const user = await User.findById(userId).select("+password +refreshTokenHash +refreshTokenExpiresAt");
    if (!user) throw new ApiError("User not found", 404);
    if (!user.password) throw new ApiError("User has no password set", 400);

    const ok = await user.correctPassword(currentPassword, user.password);
    if (!ok) throw new ApiError("Your current password is wrong.", 401);

    if (newPassword !== newPasswordConfirm) throw new ApiError("Passwords do not match", 400);

    user.password = newPassword;
    // Optional extra safety: invalidate any existing refresh
    user.refreshTokenHash = undefined as any;
    user.refreshTokenExpiresAt = undefined as any;

    await user.save();
    return user;
};

export const protect = async (token: string): Promise<IUser> => {
    if (!token) throw new ApiError("You are not logged in! Please log in to get access.", 401);

    type Decoded = JwtPayload & { id: string; iat: number };
    let decoded: Decoded;

    try {
        decoded = jwt.verify(token, JWT_SECRET) as Decoded;
    } catch {
        throw new ApiError("Invalid token. Please log in again!", 401);
    }

    if (!decoded || typeof decoded !== "object" || !decoded.id || typeof decoded.iat !== "number") {
        throw new ApiError("Invalid token payload.", 401);
    }

    const currentUser = await User.findById(decoded.id).select("+role"); // Explicitly include role
    if (!currentUser) throw new ApiError("The user belonging to this token does no longer exist.", 401);

    if (currentUser.active === false) {
        throw new ApiError("Account is deactivated.", 401);
    }

    if (currentUser.changedPasswordAfter(decoded.iat)) {
        throw new ApiError("User recently changed password! Please log in again.", 401);
    }

    return currentUser;
};