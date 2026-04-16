/**
 * Calculate BMI from weight (kg) and height (cm)
 */
export declare const calculateBMI: (weight: number, height: number) => number;
/**
 * Get BMI category
 */
export declare const getBMICategory: (bmi: number) => string;
/**
 * Generate a 6-digit OTP
 */
export declare const generateOTP: () => string;
/**
 * Generate a secure random token (for password reset)
 */
export declare const generateSecureToken: () => string;
/**
 * Add minutes to a date
 */
export declare const addMinutes: (date: Date, minutes: number) => Date;
/**
 * Add days to a date
 */
export declare const addDays: (date: Date, days: number) => Date;
/**
 * Check if a date is in the past
 */
export declare const isPast: (date: Date) => boolean;
/**
 * Format date as YYYY-MM-DD
 */
export declare const formatDate: (date: Date) => string;
/**
 * Parse date string safely
 */
export declare const parseDate: (dateStr: string) => Date;
/**
 * Paginate query helper
 */
export declare const getPagination: (page?: number, limit?: number) => {
    skip: number;
    take: number;
    page: number;
    limit: number;
};
/**
 * Build pagination meta
 */
export declare const buildPaginationMeta: (total: number, page: number, limit: number) => {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};
/**
 * Sanitize user for public response (remove sensitive fields)
 */
export declare const sanitizeUser: (user: Record<string, unknown>) => {
    [x: string]: unknown;
};
//# sourceMappingURL=helpers.d.ts.map