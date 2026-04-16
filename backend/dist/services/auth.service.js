"use strict";
// src/services/auth.service.ts
// Authentication business logic
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPhoneOTP = exports.sendPhoneOTP = exports.resetPassword = exports.initiateForgotPassword = exports.logoutUser = exports.refreshAccessToken = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const jwt_1 = require("../utils/jwt");
const helpers_1 = require("../utils/helpers");
const env_1 = require("../config/env");
const twilio_service_1 = require("./twilio.service");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
// ─────────────────────────────────────────
// SUBSCRIPTION PLAN MAP
// ─────────────────────────────────────────
const getRoleDefaultPlan = (role, isFreelance) => {
    if (role === client_1.Role.GYM_OWNER)
        return client_1.PlanType.OWNER_500;
    if (role === client_1.Role.TRAINER)
        return client_1.PlanType.FREELANCER_200;
    return client_1.PlanType.NORMAL_100;
};
// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────
const registerUser = async (input) => {
    let { name, email, password, phone, role, isFreelance, age, gender, height, weight, medicalConditions, goals, activityLevel, preferences } = input;
    // Sanitize phone — treat empty string as no phone provided
    if (!phone || phone.trim() === '') {
        phone = undefined;
    }
    // Normalize phone (ensure +91)
    if (phone && /^[6-9]\d{9}$/.test(phone)) {
        phone = `+91${phone}`;
    }
    // Check if email taken
    const existingUser = await db_1.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new errorHandler_1.AppError('Email already registered', 409);
    }
    // Check phone uniqueness — only when a real phone number was provided
    if (phone) {
        const existingPhone = await db_1.prisma.user.findUnique({ where: { phone } });
        if (existingPhone) {
            throw new errorHandler_1.AppError('Phone number already in use', 409);
        }
    }
    // Hash password
    const hashedPassword = await bcryptjs_1.default.hash(password, env_1.config.bcryptRounds);
    // Calculate BMI
    let bmi;
    if (height && weight) {
        bmi = (0, helpers_1.calculateBMI)(weight, height);
    }
    // Create user and subscription in a transaction
    const trialEndsAt = (0, helpers_1.addDays)(new Date(), 30);
    const planType = getRoleDefaultPlan(role, isFreelance);
    const user = await db_1.prisma.$transaction(async (tx) => {
        const createdUser = await tx.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                role: role,
                isFreelance,
                age,
                gender: gender,
                height,
                weight,
                bmi,
                medicalConditions: medicalConditions ?? [],
                goals: goals ?? [],
                activityLevel: activityLevel,
                preferences: preferences ?? [],
            },
        });
        await tx.subscription.create({
            data: {
                userId: createdUser.id,
                planType,
                status: client_1.SubscriptionStatus.trial,
                trialEndsAt,
            },
        });
        // Welcome notification
        await tx.notification.create({
            data: {
                userId: createdUser.id,
                type: 'welcome',
                title: 'Welcome to FitAI Hub! 🎉',
                body: `Hi ${name}! Your 30-day free trial has started. Generate your personalized AI fitness plan now!`,
            },
        });
        return createdUser;
    });
    // Generate tokens
    const accessToken = (0, jwt_1.signAccessToken)({ userId: user.id, role: user.role, email: user.email });
    const refreshToken = (0, jwt_1.signRefreshToken)({ userId: user.id });
    // Store refresh token in DB
    await db_1.prisma.refreshToken.create({
        data: {
            userId: user.id,
            token: refreshToken,
            expiresAt: (0, helpers_1.addDays)(new Date(), 7),
        },
    });
    return {
        userId: user.id,
        role: user.role,
        token: accessToken,
        refreshToken,
        subscription: { status: 'trial', trialEndsAt: trialEndsAt.toISOString() },
    };
};
exports.registerUser = registerUser;
// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
const loginUser = async (input) => {
    const { email, password } = input;
    const user = await db_1.prisma.user.findUnique({
        where: { email },
        select: {
            id: true, name: true, email: true, role: true, password: true, isActive: true,
        },
    });
    if (!user || !user.isActive) {
        throw new errorHandler_1.AppError('Invalid email or password', 401);
    }
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new errorHandler_1.AppError('Invalid email or password', 401);
    }
    // Update last login
    await db_1.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const accessToken = (0, jwt_1.signAccessToken)({ userId: user.id, role: user.role, email: user.email });
    const refreshToken = (0, jwt_1.signRefreshToken)({ userId: user.id });
    // Revoke old refresh tokens and store new one
    await db_1.prisma.refreshToken.updateMany({
        where: { userId: user.id, isRevoked: false },
        data: { isRevoked: true },
    });
    await db_1.prisma.refreshToken.create({
        data: {
            userId: user.id,
            token: refreshToken,
            expiresAt: (0, helpers_1.addDays)(new Date(), 7),
        },
    });
    return {
        token: accessToken,
        refreshToken,
        user: { id: user.id, name: user.name, role: user.role },
    };
};
exports.loginUser = loginUser;
// ─────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────
const refreshAccessToken = async (refreshToken) => {
    let decoded;
    try {
        decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
    }
    catch {
        throw new errorHandler_1.AppError('Invalid or expired refresh token', 401);
    }
    const storedToken = await db_1.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!storedToken || storedToken.isRevoked || (0, helpers_1.isPast)(storedToken.expiresAt)) {
        throw new errorHandler_1.AppError('Refresh token revoked or expired', 401);
    }
    const user = await db_1.prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, email: true, isActive: true },
    });
    if (!user || !user.isActive) {
        throw new errorHandler_1.AppError('User not found', 401);
    }
    const newAccessToken = (0, jwt_1.signAccessToken)({ userId: user.id, role: user.role, email: user.email });
    const newRefreshToken = (0, jwt_1.signRefreshToken)({ userId: user.id });
    // Rotate refresh token
    await db_1.prisma.refreshToken.update({ where: { id: storedToken.id }, data: { isRevoked: true } });
    await db_1.prisma.refreshToken.create({
        data: { userId: user.id, token: newRefreshToken, expiresAt: (0, helpers_1.addDays)(new Date(), 7) },
    });
    return { token: newAccessToken, refreshToken: newRefreshToken };
};
exports.refreshAccessToken = refreshAccessToken;
// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────
const logoutUser = async (userId, refreshToken) => {
    if (refreshToken) {
        await db_1.prisma.refreshToken.updateMany({
            where: { userId, token: refreshToken },
            data: { isRevoked: true },
        });
    }
    else {
        // Revoke all tokens for user
        await db_1.prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false },
            data: { isRevoked: true },
        });
    }
};
exports.logoutUser = logoutUser;
// ─────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────
const initiateForgotPassword = async (email) => {
    const user = await db_1.prisma.user.findUnique({ where: { email } });
    // Always return success to prevent email enumeration attacks
    if (!user)
        return;
    // Invalidate existing tokens
    await db_1.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, isUsed: false },
        data: { isUsed: true },
    });
    const token = (0, helpers_1.generateSecureToken)();
    const expiresAt = (0, helpers_1.addMinutes)(new Date(), 30);
    await db_1.prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
    });
    // In production, send via email. For now, log it.
    logger_1.logger.info(`Password reset token for ${email}: ${token}`);
    // TODO: Integrate nodemailer for email sending
    return token; // Return for testing purposes
};
exports.initiateForgotPassword = initiateForgotPassword;
// ─────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────
const resetPassword = async (token, newPassword) => {
    const resetToken = await db_1.prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.isUsed || (0, helpers_1.isPast)(resetToken.expiresAt)) {
        throw new errorHandler_1.AppError('Invalid or expired reset token', 400);
    }
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, env_1.config.bcryptRounds);
    await db_1.prisma.$transaction([
        db_1.prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } }),
        db_1.prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { isUsed: true } }),
        db_1.prisma.refreshToken.updateMany({ where: { userId: resetToken.userId }, data: { isRevoked: true } }),
    ]);
};
exports.resetPassword = resetPassword;
// ─────────────────────────────────────────
// SEND OTP (via Twilio)
// ─────────────────────────────────────────
const sendPhoneOTP = async (userId, phone) => {
    const otp = (0, helpers_1.generateOTP)();
    const expiresAt = (0, helpers_1.addMinutes)(new Date(), env_1.config.otpExpiryMinutes);
    // Invalidate previous OTPs
    await db_1.prisma.oTPCode.updateMany({ where: { userId, isUsed: false }, data: { isUsed: true } });
    await db_1.prisma.oTPCode.create({ data: { userId, code: otp, expiresAt } });
    // Send via Twilio
    await twilio_service_1.twilioService.sendSMS(phone, `Your FitAI Hub OTP is: ${otp}. Valid for ${env_1.config.otpExpiryMinutes} minutes.`);
    return true;
};
exports.sendPhoneOTP = sendPhoneOTP;
// ─────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────
const verifyPhoneOTP = async (userId, otp) => {
    const otpRecord = await db_1.prisma.oTPCode.findFirst({
        where: { userId, code: otp, isUsed: false },
        orderBy: { createdAt: 'desc' },
    });
    if (!otpRecord || (0, helpers_1.isPast)(otpRecord.expiresAt)) {
        throw new errorHandler_1.AppError('Invalid or expired OTP', 400);
    }
    await db_1.prisma.oTPCode.update({ where: { id: otpRecord.id }, data: { isUsed: true } });
    return true;
};
exports.verifyPhoneOTP = verifyPhoneOTP;
//# sourceMappingURL=auth.service.js.map