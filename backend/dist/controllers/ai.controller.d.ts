import { Request, Response, NextFunction } from 'express';
export declare const generatePlan: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getTodayPlan: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPlanByDate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPlanHistory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPlanById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const overridePlan: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getClientCurrentPlan: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const estimateCalories: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const estimateFoodNutrition: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=ai.controller.d.ts.map