"use strict";
// src/config/db.ts
// Prisma Client singleton instance
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const createPrismaClient = () => {
    const client = new client_1.PrismaClient({
        log: [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
        ],
    });
    client.$on('query', (e) => {
        logger_1.logger.debug(`Prisma Query: ${e.query}`, { params: e.params, duration: `${e.duration}ms` });
    });
    client.$on('error', (e) => {
        logger_1.logger.error(`Prisma Error: ${e.message}`);
    });
    client.$on('info', (e) => {
        logger_1.logger.info(`Prisma Info: ${e.message}`);
    });
    client.$on('warn', (e) => {
        logger_1.logger.warn(`Prisma Warn: ${e.message}`);
    });
    return client;
};
exports.prisma = global.__prisma ?? (global.__prisma = createPrismaClient());
// Graceful shutdown handling
process.on('beforeExit', async () => {
    await exports.prisma.$disconnect();
});
//# sourceMappingURL=db.js.map