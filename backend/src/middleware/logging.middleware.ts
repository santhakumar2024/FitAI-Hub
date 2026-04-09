// src/middleware/logging.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url, body } = req;

  // Clone or capture response send/json methods to log response bodies
  const originalJson = res.json;
  const originalSend = res.send;

  let responseBody: any;

  res.json = function (chunk: any): Response {
    responseBody = chunk;
    return originalJson.apply(res, arguments as any);
  };

  res.send = function (chunk: any): Response {
    responseBody = chunk;
    return originalSend.apply(res, arguments as any);
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
      logger.error(message, logData);
    } else {
      logger.info(message, logData);
    }
  });

  next();
};
