import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
    _id: mongoose.Types.ObjectId; // Explicitly define _id
    id?: string; // Virtual property
    name: string;
    email: string;
    photo?: string;
    role?: 'user' | 'admin';
    password?: string;
    passwordChangedAt?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    active?: boolean;
    googleId?: string;
    firebaseUid?: string;
}

export interface IUserMethods {
    generateAuthToken(): string;
    changedPasswordAfter(JWTTimestamp: number): boolean;
    correctPassword(candidatePassword: string, userPassword: string): Promise<boolean>;
    createPasswordResetToken(): string;
}

export interface IUserModel extends mongoose.Model<IUser, {}, IUserMethods> {
    // Add static methods here if needed
}

export interface IGoogleUser {
    id: string;
    displayName: string;
    name: { familyName: string; givenName: string };
    emails: { value: string; verified: boolean }[];
    photos: { value: string }[];
    provider: string;
}