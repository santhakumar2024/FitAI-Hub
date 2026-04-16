import { Request, Response, NextFunction } from 'express';
export declare const createOrder: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const webhookHandler: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const cancelSubscription: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=subscription.controller.d.ts.map