import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../utils/jwt';
import { Role } from '@prisma/client';
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload & {
                isFreelance?: boolean;
                gymId?: string | null;
            };
        }
    }
}
/**
 * protect — Validates the Bearer JWT token on every protected route
 */
export declare const protect: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * roleGuard — Restricts access to specific roles
 * Usage: roleGuard(Role.GYM_OWNER, Role.TRAINER)
 */
export declare const roleGuard: (...allowedRoles: Role[]) => (req: Request, res: Response, next: NextFunction) => void;
/**
 * freelanceGuard — Only allows freelance trainers
 */
export declare const freelanceGuard: (req: Request, res: Response, next: NextFunction) => void;
/**
 * subscriptionGuard — Ensures user has active subscription or valid trial
 */
export declare const subscriptionGuard: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map