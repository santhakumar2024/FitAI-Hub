// src/config/db.ts
// Prisma Client singleton instance

import { PrismaClient } from '@prisma/client';
import { config } from './env';

declare global {
  // Prevent multiple Prisma instances in development (hot-reload)
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

import { logger } from '../utils/logger';

const createPrismaClient = () => {
  const client = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ],
  });

  client.$on('query' as any, (e: any) => {
    logger.debug(`Prisma Query: ${e.query}`, { params: e.params, duration: `${e.duration}ms` });
  });

  client.$on('error' as any, (e: any) => {
    logger.error(`Prisma Error: ${e.message}`);
  });

  client.$on('info' as any, (e: any) => {
    logger.info(`Prisma Info: ${e.message}`);
  });

  client.$on('warn' as any, (e: any) => {
    logger.warn(`Prisma Warn: ${e.message}`);
  });

  return client;
};

export const prisma: PrismaClient = (global as any).__prisma ?? ((global as any).__prisma = createPrismaClient());

// Graceful shutdown handling
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
