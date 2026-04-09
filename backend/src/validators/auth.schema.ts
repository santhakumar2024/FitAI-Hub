// src/validators/auth.schema.ts
// Zod validation schemas for auth endpoints

import { z } from 'zod';

const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%&*!])[A-Za-z\d@#$%&*!]{12,16}$/;

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
  phone: z.string().optional(),
  role: z.enum(['NORMAL_USER', 'GYM_OWNER', 'TRAINER']).default('NORMAL_USER'),
  isFreelance: z.boolean().optional().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  age: z.number().int().min(10).max(100).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  photoUrl: z.string().url().optional(),
  
  // New Fields
  work: z.string().optional(),
  mobileNumber: z.string().optional(),
  goalType: z.string().optional(),
  targetWeight: z.number().positive().optional(),
  timeline: z.string().optional(),
  motivationLevel: z.number().int().min(1).max(10).optional(),
  experienceLevel: z.string().optional(),
  recentActivity: z.number().int().nonnegative().optional(),
  pushupTest: z.number().int().nonnegative().optional(),
  squatTest: z.number().int().nonnegative().optional(),
  workoutLocation: z.string().optional(),
  equipmentAccess: z.array(z.string()).optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  timePerSession: z.number().int().positive().optional(),
  jobNature: z.string().optional(),
  dislikedExercises: z.array(z.string()).optional(),
  trainingStyle: z.string().optional(),
  medicalConditions: z.array(z.string()).optional(),
  medicalScreening: z.record(z.any()).optional(),
  goals: z.array(z.string()).optional(),
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active']).optional(),
  preferences: z.array(z.string()).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .regex(passwordRegex, 'Password must include uppercase, lowercase, number and special character'),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Invalid phone number'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .regex(passwordRegex, 'Password must include uppercase, lowercase, number and special character'),
});
