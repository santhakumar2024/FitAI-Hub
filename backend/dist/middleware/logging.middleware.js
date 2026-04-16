"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingMiddleware = void 0;
const logger_1 = require("../utils/logger");
const loggingMiddleware = (req, res, next) => {
    const start = Date.now();
    const { method, url, body } = req;
    // Clone or capture response send/json methods to log response bodies
    const originalJson = res.json;
    const originalSend = res.send;
    let responseBody;
    res.json = function (chunk) {
        responseBody = chunk;
        return originalJson.apply(res, arguments);
    };
    res.send = function (chunk) {
        responseBody = chunk;
        return originalSend.apply(res, arguments);
    };
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        const logData = {
            method,
            url,
            duration: `${duration}ms`,
            statusCode,
            requestBody: method !== 'GET' ? body : undefined,
            responseBody: responseBody,
        };
        const message = `API Response: ${statusCode} (${duration}ms)`;
        if (statusCode >= 400) {
            console.log(`❌ [API ${statusCode}] ${method} ${url} - ${duration}ms`);
            logger_1.logger.error(message, logData);
        }
        else {
            console.log(`✅ [API ${statusCode}] ${method} ${url} - ${duration}ms`);
            logger_1.logger.info(message, logData);
        }
    });
    next();
};
exports.loggingMiddleware = loggingMiddleware;
//# sourceMappingURL=logging.middleware.js.map