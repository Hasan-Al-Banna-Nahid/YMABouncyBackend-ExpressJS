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
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userSchema = new mongoose_1.default.Schema({
    name: { type: String, required: [true, 'Please tell us your name'], index: true },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        index: true,
        validate: {
            validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: 'Please provide a valid email address',
        },
    },
    photo: {
        type: String,
        default: null, // Optional photo URL
    },
    role: { type: String, enum: ['user', 'admin'], default: 'user', required: true, index: true, select: false },
    password: { type: String, minlength: 8, select: false },
    passwordChangedAt: { type: Date, index: true },
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshTokenHash: { type: String, select: false },
    refreshTokenExpiresAt: { type: Date, select: false },
    active: { type: Boolean, default: true, select: false, index: true },
    googleId: { type: String, index: true },
    firebaseUid: { type: String, index: true },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: (_doc, ret) => {
            if (ret._id) {
                ret.id = ret._id.toString();
                delete ret._id;
            }
            delete ret.__v;
        },
    },
    toObject: { virtuals: true },
});
// Indexes
userSchema.index({ createdAt: -1 });
userSchema.index({ name: 'text', email: 'text' }); // single text index (use carefully)
// Hash password if modified
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified('password') || !this.password)
            return next();
        const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
        this.password = yield bcryptjs_1.default.hash(this.password, rounds);
        next();
    });
});
// Update passwordChangedAt
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew)
        return next();
    this.passwordChangedAt = new Date(Date.now() - 1000);
    next();
});
// Methods
userSchema.method('correctPassword', function (candidate, hashed) {
    return __awaiter(this, void 0, void 0, function* () {
        return bcryptjs_1.default.compare(candidate, hashed);
    });
});
userSchema.method('changedPasswordAfter', function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changed = Math.floor(this.passwordChangedAt.getTime() / 1000);
        return JWTTimestamp < changed;
    }
    return false;
});
userSchema.method('signAccessToken', function () {
    var _a;
    const secret = process.env.JWT_SECRET;
    const options = { expiresIn: (_a = process.env.JWT_EXPIRES_IN) !== null && _a !== void 0 ? _a : '15m' };
    return jsonwebtoken_1.default.sign({ id: this._id.toString() }, secret, options);
});
userSchema.method('signRefreshToken', function () {
    var _a;
    const secret = process.env.JWT_REFRESH_SECRET;
    const options = { expiresIn: (_a = process.env.JWT_REFRESH_EXPIRES_IN) !== null && _a !== void 0 ? _a : '30d' };
    return jsonwebtoken_1.default.sign({ id: this._id.toString(), typ: 'refresh' }, secret, options);
});
userSchema.method('setRefreshToken', function (refreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const hash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
        this.refreshTokenHash = hash;
        const decoded = jsonwebtoken_1.default.decode(refreshToken);
        if (decoded === null || decoded === void 0 ? void 0 : decoded.exp)
            this.refreshTokenExpiresAt = new Date(decoded.exp * 1000);
        yield this.save({ validateBeforeSave: false });
    });
});
userSchema.method('createPasswordResetToken', function () {
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    return resetToken;
});
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
