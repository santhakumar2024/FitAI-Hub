"use strict";
// src/middleware/errorHandler.ts
// Global error handling middleware
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) => {
    logger_1.logger.error(`App Error: ${err.message}`, {
        method: req.method,
        url: req.path,
        stack: err.stack
    });
    // Zod validation errors
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            error: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }
    // Prisma unique constraint violation
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') {
            const fields = err.meta?.target?.join(', ') ?? 'field';
            res.status(409).json({
                success: false,
                message: `A record with this ${fields} already exists`,
                error: err.code,
            });
            return;
        }
        if (err.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: 'Record not found',
                error: err.code,
            });
            return;
        }
    }
    // Operational errors (known, thrown intentionally)
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({ success: false, message: 'Invalid token' });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({ success: false, message: 'Token expired' });
        return;
    }
    // Generic fallback
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    });
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found`,
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=errorHandler.js.map