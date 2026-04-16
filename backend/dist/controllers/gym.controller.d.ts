import { Request, Response, NextFunction } from 'express';
export declare const createGym: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getMyGyms: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getGymDetails: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateGym: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const addTrainerToGym: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getGymTrainers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const removeTrainerFromGym: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getGymMembers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const assignClientToTrainer: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const unassignClient: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getGymStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const addGymMember: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getGymRevenue: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getGymAISuggestions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=gym.controller.d.ts.map