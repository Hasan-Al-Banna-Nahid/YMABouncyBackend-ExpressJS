"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectRoute = void 0;
exports.restrictTo = restrictTo;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const throw ApiError_1 = __importDefault(require("../utils/throw ApiError"));
const auth_service_1 = require("../services/auth.service");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// export const protectRoute = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
//   const headerToken = req.headers.authorization?.startsWith("Bearer ")
//     ? req.headers.authorization.split(" ")[1]
//     : undefined;
//   const cookieToken = req.cookies?.accessToken as string | undefined;
//   const token = headerToken || cookieToken;
//   if (!token)  new throw ApiError("No token provided", 401);
//   const currentUser = await verifyAccessToken(token);
//   (req as AuthenticatedRequest).user = currentUser;
//   next();
// });
function restrictTo(...roles) {
  return (req, _res, next) => {
    const aReq = req;
    if (!aReq.user || !roles.includes(aReq.user.role)) {
      new throw ApiError_1.default("Unauthorized", 403);
    }
    next();
  };
}
exports.protectRoute = (0, asyncHandler_1.default)(async (req, _res, next) => {
  const cookieToken = req.cookies?.accessToken;
  const headerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : undefined;
  let tokenToUse = cookieToken || headerToken;
  // If both exist (common when the client sends an old header token), choose the newer by iat
  if (cookieToken && headerToken && headerToken !== cookieToken) {
    const ciat = jsonwebtoken_1.default.decode(cookieToken)?.iat ?? 0;
    const hiat = jsonwebtoken_1.default.decode(headerToken)?.iat ?? 0;
    tokenToUse = ciat >= hiat ? cookieToken : headerToken;
  }
  if (!tokenToUse) new throw ApiError_1.default("No token provided", 401);
  const currentUser = await (0, auth_service_1.protect)(tokenToUse);
  req.user = currentUser;
  next();
});
