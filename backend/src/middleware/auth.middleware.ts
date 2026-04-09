// src/middleware/auth.middleware.ts
// JWT authentication + role-based guard middleware

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { prisma } from '../config/db';
import { unauthorized, forbidden } from '../utils/apiResponse';
import { Role } from '@prisma/client';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { isFreelance?: boolean; gymId?: string | null };
    }
  }
}

/**
 * protect — Validates the Bearer JWT token on every protected route
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      unauthorized(res, 'Authentication token required');
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Check user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, email: true, isActive: true, isFreelance: true, gymId: true },
    });

    if (!user || !user.isActive) {
      unauthorized(res, 'User not found or deactivated');
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
  } catch (error) {
    unauthorized(res, 'Invalid or expired token');
  }
};

/**
 * roleGuard — Restricts access to specific roles
 * Usage: roleGuard(Role.GYM_OWNER, Role.TRAINER)
 */
export const roleGuard = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res);
      return;
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      forbidden(res, `Access denied. Required role(s): ${allowedRoles.join(', ')}`);
      return;
    }

    next();
  };
};

/**
 * freelanceGuard — Only allows freelance trainers
 */
export const freelanceGuard = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    unauthorized(res);
    return;
  }

  if (req.user.role !== Role.TRAINER || !req.user.isFreelance) {
    forbidden(res, 'Access denied. Freelance trainers only.');
    return;
  }

  next();
};

/**
 * subscriptionGuard — Ensures user has active subscription or valid trial
 */
export const subscriptionGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      unauthorized(res);
      return;
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: req.user.userId },
    });

    if (!subscription) {
      logger.error(`Subscription check failed: No record for user ${req.user.userId}`);
      forbidden(res, 'No active subscription found. Please register/login again.');
      return;
    }

    if (subscription.status === 'trial') {
      if (subscription.trialEndsAt && subscription.trialEndsAt < new Date()) {
        logger.error(`Subscription check failed: Trial expired for user ${req.user.userId}`);
        forbidden(res, 'Free trial expired. Please subscribe to continue.');
        return;
      }
    } else if (subscription.status === 'expired' || subscription.status === 'cancelled') {
      logger.error(`Subscription check failed: Status is ${subscription.status} for user ${req.user.userId}`);
      forbidden(res, 'Subscription expired. Please renew to continue.');
      return;
    }

    next();
  } catch (error) {
    forbidden(res, 'Subscription check failed');
  }
};
