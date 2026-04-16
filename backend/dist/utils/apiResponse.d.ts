import { Response } from 'express';
export interface ApiSuccess<T = unknown> {
    success: true;
    message: string;
    data?: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}
export interface ApiError {
    success: false;
    message: string;
    error?: unknown;
}
/**
 * Send a success response
 */
export declare const sendSuccess: <T>(res: Response, message: string, data?: T, statusCode?: number, meta?: ApiSuccess["meta"]) => void;
/**
 * Send an error response
 */
export declare const sendError: (res: Response, message: string, statusCode?: number, error?: unknown) => void;
export declare const ok: <T>(res: Response, message: string, data?: T, meta?: ApiSuccess["meta"]) => void;
export declare const created: <T>(res: Response, message: string, data?: T) => void;
export declare const noContent: (res: Response, message: string) => void;
export declare const badRequest: (res: Response, message: string, error?: unknown) => void;
export declare const unauthorized: (res: Response, message?: string) => void;
export declare const forbidden: (res: Response, message?: string) => void;
export declare const notFound: (res: Response, message?: string) => void;
export declare const conflict: (res: Response, message: string) => void;
export declare const serverError: (res: Response, message?: string, error?: unknown) => void;
//# sourceMappingURL=apiResponse.d.ts.map