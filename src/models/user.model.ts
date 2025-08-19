import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { SignOptions } from 'jsonwebtoken';
import { IUser, IUserMethods, IUserModel } from '../interfaces/user.interface';

const userSchema = new mongoose.Schema<IUser, IUserModel, IUserMethods>(
    {
        name: {
            type: String,
            required: [true, 'Please tell us your name'],
        },
        email: {
            type: String,
            required: [true, 'Please provide your email'],
            unique: true,
            lowercase: true,
            validate: {
                validator: function (value: string) {
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                },
                message: 'Please provide a valid email address',
            },
        },
        photo: String,
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
            required: true,
        },
        password: {
            type: String,
            minlength: 8,
            select: false,
        },
        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        active: {
            type: Boolean,
            default: true,
            select: false,
        },
        googleId: String,
        firebaseUid: String,
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc: IUser, ret: { _id?: mongoose.Types.ObjectId; __v?: number; id?: string }) {
                if (ret._id) {
                    ret.id = ret._id.toString();
                    delete ret._id;
                }
                if (ret.__v !== undefined) {
                    delete ret.__v;
                }
            },
        },
        toObject: { virtuals: true },
    }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });

// Instance methods
userSchema.method('generateAuthToken', function (this: IUser): string {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined');
    }
    // const options: SignOptions = {
    //     expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    // };
    return jwt.sign({ id: this._id.toString() }, process.env.JWT_SECRET);
});

userSchema.method('changedPasswordAfter', function (this: IUser, JWTTimestamp: number): boolean {
    if (this.passwordChangedAt) {
        const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
});

userSchema.method('correctPassword', async function (
    this: IUser,
    candidatePassword: string,
    userPassword: string
): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, userPassword);
});

userSchema.method('createPasswordResetToken', function (this: IUser): string {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return resetToken;
});

const User = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;