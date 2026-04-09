// src/services/auth.service.ts
// Authentication business logic

import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { calculateBMI, generateOTP, generateSecureToken, addMinutes, addDays, isPast } from '../utils/helpers';
import { RegisterInput, LoginInput } from '../validators/auth.schema';
import { config } from '../config/env';
import { twilioService } from './twilio.service';
import { AppError } from '../middleware/errorHandler';
import { Role, SubscriptionStatus, PlanType } from '@prisma/client';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────
// SUBSCRIPTION PLAN MAP
// ─────────────────────────────────────────
const getRoleDefaultPlan = (role: Role, isFreelance: boolean): PlanType => {
  if (role === Role.GYM_OWNER) return PlanType.OWNER_500;
  if (role === Role.TRAINER) return PlanType.FREELANCER_200;
  return PlanType.NORMAL_100;
};

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────
export const registerUser = async (input: RegisterInput) => {
  let { name, email, password, phone, role, isFreelance, age, gender, height, weight,
    medicalConditions, goals, activityLevel, preferences } = input;

  // Sanitize phone — treat empty string as no phone provided
  if (!phone || phone.trim() === '') {
    phone = undefined;
  }

  // Normalize phone (ensure +91)
  if (phone && /^[6-9]\d{9}$/.test(phone)) {
    phone = `+91${phone}`;
  }

  // Check if email taken
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  // Check phone uniqueness — only when a real phone number was provided
  if (phone) {
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      throw new AppError('Phone number already in use', 409);
    }
  }


  // Hash password
  const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

  // Calculate BMI
  let bmi: number | undefined;
  if (height && weight) {
    bmi = calculateBMI(weight, height);
  }

  // Create user and subscription in a transaction
  const trialEndsAt = addDays(new Date(), 30);
  const planType = getRoleDefaultPlan(role as Role, isFreelance);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: role as Role,
        isFreelance,
        age,
        gender: gender as 'male' | 'female' | 'other' | undefined,
        height,
        weight,
        bmi,
        medicalConditions: medicalConditions ?? [],
        goals: goals ?? [],
        activityLevel: activityLevel as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active',
        preferences: preferences ?? [],
      },
    });

    await tx.subscription.create({
      data: {
        userId: createdUser.id,
        planType,
        status: SubscriptionStatus.trial,
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
  const accessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.id });

  // Store refresh token in DB
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: addDays(new Date(), 7),
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

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────
export const loginUser = async (input: LoginInput) => {
  const { email, password } = input;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true, name: true, email: true, role: true, password: true, isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last login
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const accessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email });
  const refreshToken = signRefreshToken({ userId: user.id });

  // Revoke old refresh tokens and store new one
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, isRevoked: false },
    data: { isRevoked: true },
  });

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: addDays(new Date(), 7),
    },
  });

  return {
    token: accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, role: user.role },
  };
};

// ─────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────
export const refreshAccessToken = async (refreshToken: string) => {
  let decoded: { userId: string };
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

  if (!storedToken || storedToken.isRevoked || isPast(storedToken.expiresAt)) {
    throw new AppError('Refresh token revoked or expired', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, email: true, isActive: true },
  });

  if (!user || !user.isActive) {
    throw new AppError('User not found', 401);
  }

  const newAccessToken = signAccessToken({ userId: user.id, role: user.role, email: user.email });
  const newRefreshToken = signRefreshToken({ userId: user.id });

  // Rotate refresh token
  await prisma.refreshToken.update({ where: { id: storedToken.id }, data: { isRevoked: true } });
  await prisma.refreshToken.create({
    data: { userId: user.id, token: newRefreshToken, expiresAt: addDays(new Date(), 7) },
  });

  return { token: newAccessToken, refreshToken: newRefreshToken };
};

// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────
export const logoutUser = async (userId: string, refreshToken?: string) => {
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: { userId, token: refreshToken },
      data: { isRevoked: true },
    });
  } else {
    // Revoke all tokens for user
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }
};

// ─────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────
export const initiateForgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration attacks
  if (!user) return;

  // Invalidate existing tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, isUsed: false },
    data: { isUsed: true },
  });

  const token = generateSecureToken();
  const expiresAt = addMinutes(new Date(), 30);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  // In production, send via email. For now, log it.
  logger.info(`Password reset token for ${email}: ${token}`);
  // TODO: Integrate nodemailer for email sending

  return token; // Return for testing purposes
};

// ─────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────
export const resetPassword = async (token: string, newPassword: string) => {
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken || resetToken.isUsed || isPast(resetToken.expiresAt)) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { isUsed: true } }),
    prisma.refreshToken.updateMany({ where: { userId: resetToken.userId }, data: { isRevoked: true } }),
  ]);
};

// ─────────────────────────────────────────
// SEND OTP (via Twilio)
// ─────────────────────────────────────────
export const sendPhoneOTP = async (userId: string, phone: string) => {
  const otp = generateOTP();
  const expiresAt = addMinutes(new Date(), config.otpExpiryMinutes);

  // Invalidate previous OTPs
  await prisma.oTPCode.updateMany({ where: { userId, isUsed: false }, data: { isUsed: true } });

  await prisma.oTPCode.create({ data: { userId, code: otp, expiresAt } });

  // Send via Twilio
  await twilioService.sendSMS(phone, `Your FitAI Hub OTP is: ${otp}. Valid for ${config.otpExpiryMinutes} minutes.`);

  return true;
};

// ─────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────
export const verifyPhoneOTP = async (userId: string, otp: string) => {
  const otpRecord = await prisma.oTPCode.findFirst({
    where: { userId, code: otp, isUsed: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord || isPast(otpRecord.expiresAt)) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  await prisma.oTPCode.update({ where: { id: otpRecord.id }, data: { isUsed: true } });

  return true;
};
