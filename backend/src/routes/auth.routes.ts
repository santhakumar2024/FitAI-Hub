// src/routes/auth.routes.ts
// Auth route definitions

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validateRequest';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../validators/auth.schema';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limit for sensitive auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many attempts. Please try again in 1 hour.' },
});

// Public routes
router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh-token', validateBody(refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', strictLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', strictLimiter, validateBody(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.post('/logout', protect, authController.logout);
router.post('/send-otp', protect, authController.sendOTP);
router.post('/verify-otp', protect, authController.verifyOTP);

export default router;
