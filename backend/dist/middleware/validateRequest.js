"use strict";
// src/middleware/validateRequest.ts
// Zod schema validation middleware
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateQuery = exports.validateBody = void 0;
const zod_1 = require("zod");
/**
 * Validates request body, query, and params using a Zod schema
 */
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errorList = error.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                res.status(400).json({
                    success: false,
                    message: errorList[0]?.message ?? 'Validation failed',
                    error: errorList,
                });
                return;
            }
            next(error);
        }
    };
};
exports.validateBody = validateBody;
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Query validation failed',
                    error: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
                });
                return;
            }
            next(error);
        }
    };
};
exports.validateQuery = validateQuery;
//# sourceMappingURL=validateRequest.js.map