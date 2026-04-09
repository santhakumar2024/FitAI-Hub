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

    const { userId, role } = req.user;
    const { gymId } = req.params;

    // Determine which subscription to check
    let subscription;
    if (gymId && role === 'GYM_OWNER') {
      // Check specific gym subscription
      subscription = await prisma.subscription.findUnique({
        where: { gymId },
      });
    } else {
      // Check user-level subscription (Normal User, Trainer, or Global Owner check)
      subscription = await prisma.subscription.findFirst({
        where: { userId, gymId: null },
      });
    }

    if (!subscription) {
      logger.error(`Subscription check failed: No record for ${gymId ? `gym ${gymId}` : `user ${userId}`}`);
      forbidden(res, 'No active subscription found for this resource. Please subscribe.');
      return;
    }

    if (subscription.status === 'trial') {
      if (subscription.trialEndsAt && subscription.trialEndsAt < new Date()) {
        logger.error(`Subscription check failed: Trial expired for ${gymId ? `gym ${gymId}` : `user ${userId}`}`);
        forbidden(res, 'Free trial expired. Please subscribe to continue.');
        return;
      }
    } else if (subscription.status === 'expired' || subscription.status === 'cancelled' || subscription.status === 'past_due') {
      logger.error(`Subscription check failed: Status is ${subscription.status} for ${gymId ? `gym ${gymId}` : `user ${userId}`}`);
      forbidden(res, 'Subscription expired or past due. Please renew to continue.');
      return;
    }

    next();
  } catch (error) {
    forbidden(res, 'Subscription check failed');
  }
};
