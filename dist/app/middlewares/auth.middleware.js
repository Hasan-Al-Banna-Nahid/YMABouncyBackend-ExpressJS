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
exports.protectRoute = void 0;
exports.restrictTo = restrictTo;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const auth_service_1 = require("../services/auth.service");
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
function restrictTo(...roles) {
    return (req, _res, next) => {
        const aReq = req;
        if (!aReq.user || !roles.includes(aReq.user.role)) {
            throw new apiError_1.default("Unauthorized", 403);
        }
        next();
    };
}
