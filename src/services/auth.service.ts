import dotenv from "dotenv";
dotenv.config();

import { Request } from "express";
import jwt, { SignOptions, JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import { IUser, IGoogleUser } from "../interfaces/user.interface";
import User from "../models/user.model";
import ApiError from "../utils/apiError";
import { sendEmail } from "./email.service";

// ---- Env constants (validated once) ----
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");
const JWT_EXPIRES_IN: SignOptions["expiresIn"] =
    (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) ?? "7d";

// ---- Token helpers ----
const signToken = (id: string) =>
    jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const createSendToken = (user: IUser, statusCode: number, _req: Request, res: any) => {
    const token = signToken(user._id.toString());
    res.status(statusCode).json({
        status: "success",
        token,
        data: { user },
    });
};

// ---- Auth services (all NAMED exports) ----
export const signup = async (
    name: string,
    email: string,
    password: string,
    passwordConfirm: string
) => {
    if (password !== passwordConfirm) throw new ApiError("Passwords do not match", 400);

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new ApiError("Email already in use", 400);

    const newUser = await User.create({ name, email, password });
    return newUser;
};

export const login = async (email: string, password: string) => {
    if (!email || !password) throw new ApiError("Please provide email and password", 400);

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) throw new ApiError("Incorrect email or password", 401);

    const ok = await user.correctPassword(password, user.password);
    if (!ok) throw new ApiError("Incorrect email or password", 401);

    return user;
};

export const googleAuth = async (profile: IGoogleUser) => {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new ApiError("Google profile has no email", 400);

    let user = await User.findOne({ email });

    if (!user) {
        user = await User.create({
            name: profile.displayName,
            email,
            photo: profile.photos?.[0]?.value,
            googleId: profile.id,
            password: crypto.randomBytes(16).toString("hex"), // placeholder
        });
    } else if (!user.googleId) {
        user.googleId = profile.id;
        user.photo = profile.photos?.[0]?.value ?? user.photo;
        await user.save();
    }

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
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
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
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return user;
};

export const updatePassword = async (
    userId: string,
    currentPassword: string,
    newPassword: string,
    newPasswordConfirm: string
) => {
    const user = await User.findById(userId).select("+password");
    if (!user) throw new ApiError("User not found", 404);
    if (!user.password) throw new ApiError("User has no password set", 400);

    const ok = await user.correctPassword(currentPassword, user.password);
    if (!ok) throw new ApiError("Your current password is wrong.", 401);

    if (newPassword !== newPasswordConfirm) throw new ApiError("Passwords do not match", 400);

    user.password = newPassword;
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

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) throw new ApiError("The user belonging to this token does no longer exist.", 401);

    if (currentUser.changedPasswordAfter(decoded.iat)) {
        throw new ApiError("User recently changed password! Please log in again.", 401);
    }

    return currentUser;
};

// (Optional) explicit export list for clarity (not required, but helps avoid tree-shaking mishaps)
export {
    // already exported above; this re-export list can be omitted
    signToken, // if you want it public; otherwise remove from this list
};
