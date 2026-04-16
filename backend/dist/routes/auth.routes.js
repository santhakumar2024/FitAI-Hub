"use strict";
// src/routes/auth.routes.ts
// Auth route definitions
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController = __importStar(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validateRequest_1 = require("../middleware/validateRequest");
const auth_schema_1 = require("../validators/auth.schema");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// Rate limit for sensitive auth routes
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const strictLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { success: false, message: 'Too many attempts. Please try again in 1 hour.' },
});
// Public routes
router.post('/register', authLimiter, (0, validateRequest_1.validateBody)(auth_schema_1.registerSchema), authController.register);
router.post('/login', authLimiter, (0, validateRequest_1.validateBody)(auth_schema_1.loginSchema), authController.login);
router.post('/refresh-token', (0, validateRequest_1.validateBody)(auth_schema_1.refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', strictLimiter, (0, validateRequest_1.validateBody)(auth_schema_1.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', strictLimiter, (0, validateRequest_1.validateBody)(auth_schema_1.resetPasswordSchema), authController.resetPassword);
// Protected routes
router.post('/logout', auth_middleware_1.protect, authController.logout);
router.post('/send-otp', auth_middleware_1.protect, authController.sendOTP);
router.post('/verify-otp', auth_middleware_1.protect, authController.verifyOTP);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map