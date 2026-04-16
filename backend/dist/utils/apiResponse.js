"use strict";
// src/utils/apiResponse.ts
// Standardized API response helpers
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverError = exports.conflict = exports.notFound = exports.forbidden = exports.unauthorized = exports.badRequest = exports.noContent = exports.created = exports.ok = exports.sendError = exports.sendSuccess = void 0;
/**
 * Send a success response
 */
const sendSuccess = (res, message, data, statusCode = 200, meta) => {
    const response = { success: true, message };
    if (data !== undefined)
        response.data = data;
    if (meta)
        response.meta = meta;
    res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
/**
 * Send an error response
 */
const sendError = (res, message, statusCode = 400, error) => {
    const response = { success: false, message };
    if (error && process.env.NODE_ENV === 'development') {
        response.error = error;
    }
    res.status(statusCode).json(response);
};
exports.sendError = sendError;
// Named shortcuts
const ok = (res, message, data, meta) => (0, exports.sendSuccess)(res, message, data, 200, meta);
exports.ok = ok;
const created = (res, message, data) => (0, exports.sendSuccess)(res, message, data, 201);
exports.created = created;
const noContent = (res, message) => (0, exports.sendSuccess)(res, message, undefined, 204);
exports.noContent = noContent;
const badRequest = (res, message, error) => (0, exports.sendError)(res, message, 400, error);
exports.badRequest = badRequest;
const unauthorized = (res, message = 'Unauthorized') => (0, exports.sendError)(res, message, 401);
exports.unauthorized = unauthorized;
const forbidden = (res, message = 'Forbidden') => (0, exports.sendError)(res, message, 403);
exports.forbidden = forbidden;
const notFound = (res, message = 'Resource not found') => (0, exports.sendError)(res, message, 404);
exports.notFound = notFound;
const conflict = (res, message) => (0, exports.sendError)(res, message, 409);
exports.conflict = conflict;
const serverError = (res, message = 'Internal server error', error) => (0, exports.sendError)(res, message, 500, error);
exports.serverError = serverError;
//# sourceMappingURL=apiResponse.js.map