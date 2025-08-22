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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueTokens = exports.sanitizeUser = exports.hashToken = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
// ----- Env + types -----
const ACCESS_SECRET_ENV = process.env.JWT_SECRET;
if (!ACCESS_SECRET_ENV)
    throw new Error("JWT_SECRET is not defined");
const ACCESS_SECRET = ACCESS_SECRET_ENV;
const REFRESH_SECRET_ENV = process.env.JWT_REFRESH_SECRET;
if (!REFRESH_SECRET_ENV)
    throw new Error("JWT_REFRESH_SECRET is not defined");
const REFRESH_SECRET = REFRESH_SECRET_ENV;
const ACCESS_TTL = (_a = process.env.JWT_EXPIRES_IN) !== null && _a !== void 0 ? _a : "15m";
const REFRESH_TTL_DAYS = Number((_b = process.env.JWT_REFRESH_EXPIRES_DAYS) !== null && _b !== void 0 ? _b : 30);
// ----- helpers -----
const hashToken = (token) => crypto_1.default.createHash("sha256").update(token).digest("hex");
exports.hashToken = hashToken;
const sanitizeUser = (user) => {
    if (!user)
        return user;
    const obj = typeof user.toObject === "function" ? user.toObject() : user;
    delete obj.password;
    delete obj.refreshTokenHash;
    delete obj.passwordResetToken;
    delete obj.passwordResetExpires;
    return obj;
};
exports.sanitizeUser = sanitizeUser;
// ----- main -----
const issueTokens = (userDoc) => __awaiter(void 0, void 0, void 0, function* () {
    // Access token MUST include { id } to match protect()
    const accessToken = jsonwebtoken_1.default.sign({ id: userDoc._id.toString() }, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
    const refreshToken = jsonwebtoken_1.default.sign({ id: userDoc._id.toString() }, REFRESH_SECRET, { expiresIn: `${REFRESH_TTL_DAYS}d` });
    // persist hashed refresh token
    userDoc.refreshTokenHash = (0, exports.hashToken)(refreshToken);
    userDoc.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
    yield userDoc.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
});
exports.issueTokens = issueTokens;
