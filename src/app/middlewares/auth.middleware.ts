// middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import ApiError from "../utils/apiError";
import { IUser } from "../interfaces/user.interface";
import { protect as verifyAccessToken } from "../services/auth.service";
import jwt from "jsonwebtoken";

export type AuthenticatedRequest = Request & { user: IUser };

// export const protectRoute = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
//   const headerToken = req.headers.authorization?.startsWith("Bearer ")
//     ? req.headers.authorization.split(" ")[1]
//     : undefined;

//   const cookieToken = req.cookies?.accessToken as string | undefined;

//   const token = headerToken || cookieToken;
//   if (!token)  throw ApiError("No token provided", 401);

//   const currentUser = await verifyAccessToken(token);
//   (req as AuthenticatedRequest).user = currentUser;
//   next();
// });

export function restrictTo(...roles: Array<IUser["role"]>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const aReq = req as Partial<AuthenticatedRequest>;
    if (!aReq.user || !roles.includes(aReq.user.role)) {
      throw new ApiError("Unauthorized", 403);
    }
    next();
  };
}
export const protectRoute = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const cookieToken = (req as any).cookies?.accessToken as string | undefined;
    const headerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined;

    let tokenToUse: string | undefined = cookieToken || headerToken;

    // If both exist (common when the client sends an old header token), choose the newer by iat
    if (cookieToken && headerToken && headerToken !== cookieToken) {
      const ciat = (jwt.decode(cookieToken) as any)?.iat ?? 0;
      const hiat = (jwt.decode(headerToken) as any)?.iat ?? 0;
      tokenToUse = ciat >= hiat ? cookieToken : headerToken;
    }

    if (!tokenToUse) throw new ApiError("No token provided", 401);

    const currentUser = await verifyAccessToken(tokenToUse);
    (req as AuthenticatedRequest).user = currentUser;
    next();
  }
);
