// src/controllers/auth.controller.ts
// Authentication endpoints controller

import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { ok, created, badRequest } from '../utils/apiResponse';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.registerUser(req.body);
    created(res, 'User registered successfully. 30-day free trial activated.', result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.loginUser(req.body);

    // Set httpOnly cookie for refresh token
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    ok(res, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.body.refreshToken ?? req.cookies?.refreshToken;
    if (!token) {
      badRequest(res, 'Refresh token required');
      return;
    }

    const result = await authService.refreshAccessToken(token);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    ok(res, 'Token refreshed', result);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken ?? req.body.refreshToken;
    await authService.logoutUser(req.user!.userId, refreshToken);

    res.clearCookie('refreshToken');
    ok(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.initiateForgotPassword(req.body.email);
    // Always return success to prevent email enumeration
    ok(res, 'If an account exists with this email, you will receive a password reset link.');
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    ok(res, 'Password reset successfully. Please login with your new password.');
  } catch (error) {
    next(error);
  }
};

export const sendOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { phone } = req.body;
    await authService.sendPhoneOTP(req.user!.userId, phone);
    ok(res, 'OTP sent successfully');
  } catch (error) {
    next(error);
  }
};

export const verifyOTP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { otp } = req.body;
    await authService.verifyPhoneOTP(req.user!.userId, otp);
    ok(res, 'OTP verified successfully');
  } catch (error) {
    next(error);
  }
};
