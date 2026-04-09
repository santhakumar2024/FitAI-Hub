// src/utils/jwt.ts
// JWT utility functions

import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env';

export interface JwtPayload {
  userId: string;
  role: string;
  email: string;
}

/**
 * Sign an access token (short-lived, 15m by default)
 */
export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    issuer: 'fitai-hub',
    audience: 'fitai-hub-client',
  } as SignOptions);
};

/**
 * Sign a refresh token (long-lived, 7d by default)
 */
export const signRefreshToken = (payload: { userId: string }): string => {
  return jwt.sign(payload, config.refreshTokenSecret, {
    expiresIn: config.refreshTokenExpiresIn,
    issuer: 'fitai-hub',
    audience: 'fitai-hub-client',
  } as SignOptions);
};

/**
 * Verify an access token
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtSecret, {
    issuer: 'fitai-hub',
    audience: 'fitai-hub-client',
  }) as JwtPayload;
};

/**
 * Verify a refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, config.refreshTokenSecret, {
    issuer: 'fitai-hub',
    audience: 'fitai-hub-client',
  }) as { userId: string };
};

/**
 * Decode a token without verification (for debugging)
 */
export const decodeToken = (token: string) => {
  return jwt.decode(token);
};
