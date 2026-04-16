"use strict";
// src/middleware/auth.middleware.ts
// JWT authentication + role-based guard middleware
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionGuard = exports.freelanceGuard = exports.roleGuard = exports.protect = void 0;
const jwt_1 = require("../utils/jwt");
const db_1 = require("../config/db");
const logger_1 = require("../utils/logger");
const apiResponse_1 = require("../utils/apiResponse");
const client_1 = require("@prisma/client");
/**
 * protect — Validates the Bearer JWT token on every protected route
 */
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            (0, apiResponse_1.unauthorized)(res, 'Authentication token required');
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        // Check user still exists and is active
        const user = await db_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, role: true, email: true, isActive: true, isFreelance: true, gymId: true },
        });
        if (!user || !user.isActive) {
            (0, apiResponse_1.unauthorized)(res, 'User not found or deactivated');
            return;
        }
        req.user = {
            userId: user.id,
            role: user.role,
            email: user.email,
            isFreelance: user.isFreelance,
            gymId: user.gymId,
        };
        next();
    }
    catch (error) {
        (0, apiResponse_1.unauthorized)(res, 'Invalid or expired token');
    }
};
exports.protect = protect;
/**
 * roleGuard — Restricts access to specific roles
 * Usage: roleGuard(Role.GYM_OWNER, Role.TRAINER)
 */
const roleGuard = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            (0, apiResponse_1.unauthorized)(res);
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            (0, apiResponse_1.forbidden)(res, `Access denied. Required role(s): ${allowedRoles.join(', ')}`);
            return;
        }
        next();
    };
};
exports.roleGuard = roleGuard;
/**
 * freelanceGuard — Only allows freelance trainers
 */
const freelanceGuard = (req, res, next) => {
    if (!req.user) {
        (0, apiResponse_1.unauthorized)(res);
        return;
    }
    if (req.user.role !== client_1.Role.TRAINER || !req.user.isFreelance) {
        (0, apiResponse_1.forbidden)(res, 'Access denied. Freelance trainers only.');
        return;
    }
    next();
};
exports.freelanceGuard = freelanceGuard;
/**
 * subscriptionGuard — Ensures user has active subscription or valid trial
 */
const subscriptionGuard = async (req, res, next) => {
    try {
        if (!req.user) {
            (0, apiResponse_1.unauthorized)(res);
            return;
        }
        const { userId, role } = req.user;
        const { gymId } = req.params;
        // Determine which subscription to check
        let subscription;
        if (gymId && role === 'GYM_OWNER') {
            // Check specific gym subscription
            subscription = await db_1.prisma.subscription.findUnique({
                where: { gymId },
            });
        }
        else {
            // Check user-level subscription (Normal User, Trainer, or Global Owner check)
            subscription = await db_1.prisma.subscription.findFirst({
                where: { userId, gymId: null },
            });
        }
        if (!subscription) {
            logger_1.logger.error(`Subscription check failed: No record for ${gymId ? `gym ${gymId}` : `user ${userId}`}`);
            (0, apiResponse_1.forbidden)(res, 'No active subscription found for this resource. Please subscribe.');
            return;
        }
        if (subscription.status === 'trial') {
            if (subscription.trialEndsAt && subscription.trialEndsAt < new Date()) {
                logger_1.logger.error(`Subscription check failed: Trial expired for ${gymId ? `gym ${gymId}` : `user ${userId}`}`);
                (0, apiResponse_1.forbidden)(res, 'Free trial expired. Please subscribe to continue.');
                return;
            }
        }
        else if (subscription.status === 'expired' || subscription.status === 'cancelled' || subscription.status === 'past_due') {
            logger_1.logger.error(`Subscription check failed: Status is ${subscription.status} for ${gymId ? `gym ${gymId}` : `user ${userId}`}`);
            (0, apiResponse_1.forbidden)(res, 'Subscription expired or past due. Please renew to continue.');
            return;
        }
        next();
    }
    catch (error) {
        (0, apiResponse_1.forbidden)(res, 'Subscription check failed');
    }
};
exports.subscriptionGuard = subscriptionGuard;
//# sourceMappingURL=auth.middleware.js.map