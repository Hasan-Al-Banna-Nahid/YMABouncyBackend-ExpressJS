import express from 'express';
import {
    register,
    loginUser,
    googleLogin,
    googleLoginCallback,
    forgotPasswordHandler,
    resetPasswordHandler,
    updatePasswordHandler,
    protectRoute,
    restrictTo,
    getMe,
    updateMe,
    deleteMe,
} from '../controllers/auth.controller';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', loginUser);
router.get('/google', googleLogin);
router.get('/google/callback', googleLoginCallback);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password/:token', resetPasswordHandler);

// Protected routes (require authentication)
router.use(protectRoute);

router.patch("/update-password", updatePasswordHandler);
router.get("/me", getMe);
router.patch("/update-me", updateMe);
router.delete("/delete-me", deleteMe);

// Admin only routes
router.use(restrictTo('admin'));

// Add admin-only auth routes here if needed

export default router;