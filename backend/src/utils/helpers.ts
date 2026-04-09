// src/utils/helpers.ts
// General utility helpers

import crypto from 'crypto';

/**
 * Calculate BMI from weight (kg) and height (cm)
 */
export const calculateBMI = (weight: number, height: number): number => {
  const heightM = height / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(2));
};

/**
 * Get BMI category
 */
export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a secure random token (for password reset)
 */
export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Add minutes to a date
 */
export const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

/**
 * Check if a date is in the past
 */
export const isPast = (date: Date): boolean => {
  return date < new Date();
};

/**
 * Format date as YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Parse date string safely
 */
export const parseDate = (dateStr: string): Date => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Paginate query helper
 */
export const getPagination = (
  page = 1,
  limit = 10
): { skip: number; take: number; page: number; limit: number } => {
  const safePage = Math.max(1, parseInt(String(page), 10));
  const safeLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
    page: safePage,
    limit: safeLimit,
  };
};

/**
 * Build pagination meta
 */
export const buildPaginationMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});

/**
 * Sanitize user for public response (remove sensitive fields)
 */
export const sanitizeUser = (user: Record<string, unknown>) => {
  const { password, ...rest } = user;
  void password; // suppress unused variable warning
  return rest;
};
