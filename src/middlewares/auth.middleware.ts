import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/apiError";
import { IUser } from "../interfaces/user.interface";
import { protect as verifyAccessToken } from "../services/auth.service";

export type AuthenticatedRequest = Request & { user: IUser };

export const protectRoute = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const headerToken = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined;

    const cookieToken = (req as any).cookies?.accessToken as string | undefined;

    const token = headerToken || cookieToken;
    if (!token) throw new ApiError("No token provided", 401);

    const currentUser = await verifyAccessToken(token); // uses JWT_SECRET and checks user
    (req as AuthenticatedRequest).user = currentUser;
    next();
});

export const restrictTo = (...roles: Array<IUser["role"]>) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const aReq = req as Partial<AuthenticatedRequest>;
        if (!aReq.user || !roles.includes(aReq.user.role)) {
            throw new ApiError("Unauthorized", 403);
        }
        next();
    };
};
