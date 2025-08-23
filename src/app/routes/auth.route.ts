import express from 'express';
import {
    register,
    loginUser,
    refreshToken,
    forgotPasswordHandler,
    resetPasswordHandler,
    updatePasswordHandler,
    protectRoute,
    getMe,
    updateMe,
    deleteMe,
    logout
} from '../controllers/auth.controller';
import {restrictTo} from "../middlewares/auth.middleware"
import {upload} from "../utils/cloudinary.util";
const router = express.Router();

// Public routes
router.post('/register',upload.single("photo"), register);
router.post('/login', loginUser);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password/:token', resetPasswordHandler);

// Protected routes (require authentication)
router.use(protectRoute);

router.patch("/update-password", updatePasswordHandler);
router.get("/me", getMe);
router.patch("/update-me",upload.single("photo"), updateMe);
router.delete("/delete-me", deleteMe);

// Admin only routes
router.use(restrictTo('admin'));

// Add admin-only auth routes here if needed

export default router;