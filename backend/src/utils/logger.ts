// src/utils/logger.ts
// Winston logger instance

import winston from 'winston';
import { config } from '../config/env';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    // meta.method and meta.url will be used for "API-First" view if they exist
    const apiHeader = meta.method && meta.url ? `\x1b[1m[${meta.method}] ${meta.url}\x1b[0m — ` : '';
    const metaStr = Object.keys(meta).filter(k => k !== 'method' && k !== 'url').length 
      ? `\n${JSON.stringify(meta, (k, v) => (k === 'method' || k === 'url' ? undefined : v), 2)}` 
      : '';
      
    return `${timestamp} [${level}]: ${apiHeader}${stack ?? message}${metaStr}`;
  })
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

export const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'warn' : 'debug',
  format: config.nodeEnv === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    // Only use file logging if NOT on Vercel and in production
    ...(config.nodeEnv === 'production' && !process.env.VERCEL
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

// For Morgan integration
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
