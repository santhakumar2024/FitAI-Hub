"use strict";
// src/validators/auth.schema.ts
// Zod validation schemas for auth endpoints
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.verifyOtpSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.refreshTokenSchema = exports.loginSchema = exports.updateProfileSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*!])[A-Za-z\d@#$%&*!]{12,16}$/;
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: zod_1.z.string().min(8, 'Please confirm your password'),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(['NORMAL_USER', 'GYM_OWNER', 'TRAINER']).default('NORMAL_USER'),
    isFreelance: zod_1.z.boolean().optional().default(false),
    // Optional Fitness Profile Fields
    age: zod_1.z.number().int().optional(),
    gender: zod_1.z.enum(['male', 'female', 'other']).optional(),
    height: zod_1.z.number().optional(),
    weight: zod_1.z.number().optional(),
    bmi: zod_1.z.number().optional(),
    medicalConditions: zod_1.z.array(zod_1.z.string()).optional().default([]),
    goals: zod_1.z.array(zod_1.z.string()).optional().default([]),
    activityLevel: zod_1.z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active']).optional(),
    preferences: zod_1.z.array(zod_1.z.string()).optional().default([]),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    age: zod_1.z.number().int().min(10).max(100).optional(),
    gender: zod_1.z.enum(['male', 'female', 'other']).optional(),
    height: zod_1.z.number().positive().optional(),
    weight: zod_1.z.number().positive().optional(),
    photoUrl: zod_1.z.string().url().optional(),
    // New Fields
    work: zod_1.z.string().optional(),
    mobileNumber: zod_1.z.string().optional(),
    goalType: zod_1.z.string().optional(),
    targetWeight: zod_1.z.number().positive().optional(),
    timeline: zod_1.z.string().optional(),
    motivationLevel: zod_1.z.number().int().min(1).max(10).optional(),
    experienceLevel: zod_1.z.string().optional(),
    recentActivity: zod_1.z.number().int().nonnegative().optional(),
    pushupTest: zod_1.z.number().int().nonnegative().optional(),
    squatTest: zod_1.z.number().int().nonnegative().optional(),
    workoutLocation: zod_1.z.string().optional(),
    equipmentAccess: zod_1.z.array(zod_1.z.string()).optional(),
    daysPerWeek: zod_1.z.number().int().min(1).max(7).optional(),
    timePerSession: zod_1.z.number().int().positive().optional(),
    jobNature: zod_1.z.string().optional(),
    dislikedExercises: zod_1.z.array(zod_1.z.string()).optional(),
    trainingStyle: zod_1.z.string().optional(),
    medicalConditions: zod_1.z.array(zod_1.z.string()).optional(),
    medicalScreening: zod_1.z.record(zod_1.z.any()).optional(),
    goals: zod_1.z.array(zod_1.z.string()).optional(),
    activityLevel: zod_1.z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active']).optional(),
    preferences: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Reset token is required'),
    newPassword: zod_1.z
        .string()
        .regex(passwordRegex, 'Password must include uppercase, lowercase, number and special character'),
});
exports.verifyOtpSchema = zod_1.z.object({
    phone: zod_1.z.string().regex(phoneRegex, 'Invalid phone number'),
    otp: zod_1.z.string().length(6, 'OTP must be 6 digits'),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z
        .string()
        .regex(passwordRegex, 'Password must include uppercase, lowercase, number and special character'),
});
//# sourceMappingURL=auth.schema.js.map