// src/utils/apiResponse.ts
// Standardized API response helpers

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
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  meta?: ApiSuccess['meta']
): void => {
  const response: ApiSuccess<T> = { success: true, message };
  if (data !== undefined) response.data = data;
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
};

/**
 * Send an error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  error?: unknown
): void => {
  const response: ApiError = { success: false, message };
  if (error && process.env.NODE_ENV === 'development') {
    response.error = error;
  }
  res.status(statusCode).json(response);
};

// Named shortcuts
export const ok = <T>(res: Response, message: string, data?: T, meta?: ApiSuccess['meta']) =>
  sendSuccess(res, message, data, 200, meta);

export const created = <T>(res: Response, message: string, data?: T) =>
  sendSuccess(res, message, data, 201);

export const noContent = (res: Response, message: string) =>
  sendSuccess(res, message, undefined, 204);

export const badRequest = (res: Response, message: string, error?: unknown) =>
  sendError(res, message, 400, error);

export const unauthorized = (res: Response, message = 'Unauthorized') =>
  sendError(res, message, 401);

export const forbidden = (res: Response, message = 'Forbidden') =>
  sendError(res, message, 403);

export const notFound = (res: Response, message = 'Resource not found') =>
  sendError(res, message, 404);

export const conflict = (res: Response, message: string) =>
  sendError(res, message, 409);

export const serverError = (res: Response, message = 'Internal server error', error?: unknown) =>
  sendError(res, message, 500, error);
