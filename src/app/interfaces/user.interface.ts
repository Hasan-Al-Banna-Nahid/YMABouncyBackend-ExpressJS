import mongoose from 'mongoose';

export interface IUser extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    id?: string;
    name: string;
    email: string;
    photo?: string;
    role: 'user' | 'admin';
    password?: string;
    passwordChangedAt?: Date;

    passwordResetToken?: string;
    passwordResetExpires?: Date;

    refreshTokenHash?: string;
    refreshTokenExpiresAt?: Date;

    active?: boolean;
    googleId?: string;
    firebaseUid?: string;

    // methods
    correctPassword(candidate: string, hashed: string): Promise<boolean>;
    changedPasswordAfter(JWTTimestamp: number): boolean;
    signAccessToken(): string;
    signRefreshToken(): string;
    setRefreshToken(refreshToken: string): Promise<void>;
    createPasswordResetToken(): string;
    generateAuthToken():string;
}

export interface IUserMethods {
    correctPassword(candidate: string, hashed: string): Promise<boolean>;
    changedPasswordAfter(JWTTimestamp: number): boolean;
    signAccessToken(): string;
    signRefreshToken(): string;
    setRefreshToken(refreshToken: string): Promise<void>;
    createPasswordResetToken(): string;
    generateAuthToken():string;

}

export interface IUserModel extends mongoose.Model<IUser, {}, IUserMethods> {}

export interface IGoogleUser {
    id: string;
    displayName: string;
    name: { familyName: string; givenName: string };
    emails: { value: string; verified: boolean }[];
    photos: { value: string }[];
    provider: string;
}
