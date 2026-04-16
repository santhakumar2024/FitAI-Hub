import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode: number);
}
export declare const errorHandler: (err: Error, req: Request, res: Response, _next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response) => void;
//# sourceMappingURL=errorHandler.d.ts.map