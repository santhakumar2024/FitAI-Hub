import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
/**
 * Validates request body, query, and params using a Zod schema
 */
export declare const validateBody: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => void;
export declare const validateQuery: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validateRequest.d.ts.map