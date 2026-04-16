import { Request, Response, NextFunction } from 'express';
export declare const getMyClients: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getClientById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getClientProgress: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getClientPlans: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const addFreelanceClient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const addTrainerNote: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getClientLogs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getClientDailyLog: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getTrainerRevenue: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getTrainerAISuggestions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=trainer.controller.d.ts.map