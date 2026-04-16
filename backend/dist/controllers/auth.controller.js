"use strict";
// src/controllers/auth.controller.ts
// Authentication endpoints controller
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTP = exports.sendOTP = exports.resetPassword = exports.forgotPassword = exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const authService = __importStar(require("../services/auth.service"));
const apiResponse_1 = require("../utils/apiResponse");
const register = async (req, res, next) => {
    try {
        const result = await authService.registerUser(req.body);
        (0, apiResponse_1.created)(res, 'User registered successfully. 30-day free trial activated.', result);
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const result = await authService.loginUser(req.body);
        // Set httpOnly cookie for refresh token
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        (0, apiResponse_1.ok)(res, 'Login successful', result);
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const refreshToken = async (req, res, next) => {
    try {
        const token = req.body.refreshToken ?? req.cookies?.refreshToken;
        if (!token) {
            (0, apiResponse_1.badRequest)(res, 'Refresh token required');
            return;
        }
        const result = await authService.refreshAccessToken(token);
        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        (0, apiResponse_1.ok)(res, 'Token refreshed', result);
    }
    catch (error) {
        next(error);
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken ?? req.body.refreshToken;
        await authService.logoutUser(req.user.userId, refreshToken);
        res.clearCookie('refreshToken');
        (0, apiResponse_1.ok)(res, 'Logged out successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
const forgotPassword = async (req, res, next) => {
    try {
        await authService.initiateForgotPassword(req.body.email);
        // Always return success to prevent email enumeration
        (0, apiResponse_1.ok)(res, 'If an account exists with this email, you will receive a password reset link.');
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res, next) => {
    try {
        await authService.resetPassword(req.body.token, req.body.newPassword);
        (0, apiResponse_1.ok)(res, 'Password reset successfully. Please login with your new password.');
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
const sendOTP = async (req, res, next) => {
    try {
        const { phone } = req.body;
        await authService.sendPhoneOTP(req.user.userId, phone);
        (0, apiResponse_1.ok)(res, 'OTP sent successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.sendOTP = sendOTP;
const verifyOTP = async (req, res, next) => {
    try {
        const { otp } = req.body;
        await authService.verifyPhoneOTP(req.user.userId, otp);
        (0, apiResponse_1.ok)(res, 'OTP verified successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.verifyOTP = verifyOTP;
//# sourceMappingURL=auth.controller.js.map