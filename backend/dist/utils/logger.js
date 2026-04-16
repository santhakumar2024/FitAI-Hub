"use strict";
// src/utils/logger.ts
// Winston logger instance
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerStream = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const env_1 = require("../config/env");
const { combine, timestamp, colorize, printf, json, errors } = winston_1.default.format;
const devFormat = combine(colorize({ all: true }), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), printf(({ level, message, timestamp, stack, ...meta }) => {
    // meta.method and meta.url will be used for "API-First" view if they exist
    const apiHeader = meta.method && meta.url ? `\x1b[1m[${meta.method}] ${meta.url}\x1b[0m — ` : '';
    const metaStr = Object.keys(meta).filter(k => k !== 'method' && k !== 'url').length
        ? `\n${JSON.stringify(meta, (k, v) => (k === 'method' || k === 'url' ? undefined : v), 2)}`
        : '';
    return `${timestamp} [${level}]: ${apiHeader}${stack ?? message}${metaStr}`;
}));
const prodFormat = combine(timestamp(), errors({ stack: true }), json());
exports.logger = winston_1.default.createLogger({
    level: env_1.config.nodeEnv === 'production' ? 'warn' : 'debug',
    format: env_1.config.nodeEnv === 'production' ? prodFormat : devFormat,
    transports: [
        new winston_1.default.transports.Console(),
        // Only use file logging if NOT on Vercel and in production
        ...(env_1.config.nodeEnv === 'production' && !process.env.VERCEL
            ? [
                new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
            ]
            : []),
    ],
});
// For Morgan integration
exports.loggerStream = {
    write: (message) => {
        exports.logger.info(message.trim());
    },
};
//# sourceMappingURL=logger.js.map