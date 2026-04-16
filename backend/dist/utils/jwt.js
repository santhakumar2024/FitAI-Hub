"use strict";
// src/utils/jwt.ts
// JWT utility functions
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.signRefreshToken = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
/**
 * Sign an access token (short-lived, 15m by default)
 */
const signAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.config.jwtSecret, {
        expiresIn: env_1.config.jwtExpiresIn,
        issuer: 'fitai-hub',
        audience: 'fitai-hub-client',
    });
};
exports.signAccessToken = signAccessToken;
/**
 * Sign a refresh token (long-lived, 7d by default)
 */
const signRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, env_1.config.refreshTokenSecret, {
        expiresIn: env_1.config.refreshTokenExpiresIn,
        issuer: 'fitai-hub',
        audience: 'fitai-hub-client',
    });
};
exports.signRefreshToken = signRefreshToken;
/**
 * Verify an access token
 */
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.config.jwtSecret, {
        issuer: 'fitai-hub',
        audience: 'fitai-hub-client',
    });
};
exports.verifyAccessToken = verifyAccessToken;
/**
 * Verify a refresh token
 */
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_1.config.refreshTokenSecret, {
        issuer: 'fitai-hub',
        audience: 'fitai-hub-client',
    });
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Decode a token without verification (for debugging)
 */
const decodeToken = (token) => {
    return jsonwebtoken_1.default.decode(token);
};
exports.decodeToken = decodeToken;
//# sourceMappingURL=jwt.js.map