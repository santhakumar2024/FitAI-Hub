"use strict";
// src/utils/helpers.ts
// General utility helpers
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeUser = exports.buildPaginationMeta = exports.getPagination = exports.parseDate = exports.formatDate = exports.isPast = exports.addDays = exports.addMinutes = exports.generateSecureToken = exports.generateOTP = exports.getBMICategory = exports.calculateBMI = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Calculate BMI from weight (kg) and height (cm)
 */
const calculateBMI = (weight, height) => {
    const heightM = height / 100;
    return parseFloat((weight / (heightM * heightM)).toFixed(2));
};
exports.calculateBMI = calculateBMI;
/**
 * Get BMI category
 */
const getBMICategory = (bmi) => {
    if (bmi < 18.5)
        return 'Underweight';
    if (bmi < 25)
        return 'Normal weight';
    if (bmi < 30)
        return 'Overweight';
    return 'Obese';
};
exports.getBMICategory = getBMICategory;
/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOTP = generateOTP;
/**
 * Generate a secure random token (for password reset)
 */
const generateSecureToken = () => {
    return crypto_1.default.randomBytes(32).toString('hex');
};
exports.generateSecureToken = generateSecureToken;
/**
 * Add minutes to a date
 */
const addMinutes = (date, minutes) => {
    return new Date(date.getTime() + minutes * 60 * 1000);
};
exports.addMinutes = addMinutes;
/**
 * Add days to a date
 */
const addDays = (date, days) => {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};
exports.addDays = addDays;
/**
 * Check if a date is in the past
 */
const isPast = (date) => {
    return date < new Date();
};
exports.isPast = isPast;
/**
 * Format date as YYYY-MM-DD
 */
const formatDate = (date) => {
    return date.toISOString().split('T')[0];
};
exports.formatDate = formatDate;
/**
 * Parse date string safely
 */
const parseDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${dateStr}`);
    }
    date.setHours(0, 0, 0, 0);
    return date;
};
exports.parseDate = parseDate;
/**
 * Paginate query helper
 */
const getPagination = (page = 1, limit = 10) => {
    const safePage = Math.max(1, parseInt(String(page), 10));
    const safeLimit = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    return {
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        page: safePage,
        limit: safeLimit,
    };
};
exports.getPagination = getPagination;
/**
 * Build pagination meta
 */
const buildPaginationMeta = (total, page, limit) => ({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
});
exports.buildPaginationMeta = buildPaginationMeta;
/**
 * Sanitize user for public response (remove sensitive fields)
 */
const sanitizeUser = (user) => {
    const { password, ...rest } = user;
    void password; // suppress unused variable warning
    return rest;
};
exports.sanitizeUser = sanitizeUser;
//# sourceMappingURL=helpers.js.map