"use strict";
// src/jobs/cronJobs.ts
// Scheduled background jobs with node-cron
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const subscription_service_1 = require("../services/subscription.service");
const logger_1 = require("../utils/logger");
const db_1 = require("../config/db");
/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
    // ─────────────────────────────────────────
    // Daily: Check and expire trial subscriptions
    // Runs every day at midnight (IST = UTC+5:30 → UTC 18:30)
    // ─────────────────────────────────────────
    node_cron_1.default.schedule('30 18 * * *', async () => {
        logger_1.logger.info('⏰ Cron: Checking trial expirations...');
        try {
            const count = await (0, subscription_service_1.expireTrials)();
            logger_1.logger.info(`✅ Cron: Expired ${count} trials`);
        }
        catch (error) {
            logger_1.logger.error('❌ Cron: Trial expiration failed:', error);
        }
    }, {
        timezone: 'Asia/Kolkata',
    });
    // ─────────────────────────────────────────
    // Daily: Send subscription renewal reminders (3 days before expiry)
    // Runs daily at 9 AM IST
    // ─────────────────────────────────────────
    node_cron_1.default.schedule('0 9 * * *', async () => {
        logger_1.logger.info('⏰ Cron: Checking subscription renewals due in 3 days...');
        try {
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
            const twoDaysFromNow = new Date();
            twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
            const expiringTrials = await db_1.prisma.subscription.findMany({
                where: {
                    status: 'trial',
                    trialEndsAt: {
                        gte: twoDaysFromNow,
                        lte: threeDaysFromNow,
                    },
                },
                include: { user: { select: { id: true, name: true, fcmToken: true } } },
            });
            for (const sub of expiringTrials) {
                await db_1.prisma.notification.create({
                    data: {
                        userId: sub.userId,
                        type: 'subscription_expiry',
                        title: '⚠️ Free Trial Ending in 3 Days!',
                        body: 'Subscribe now to keep your personalized AI fitness plans and progress data.',
                    },
                });
                logger_1.logger.info(`Renewal reminder sent to user: ${sub.userId}`);
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Cron: Renewal reminder failed:', error);
        }
    }, {
        timezone: 'Asia/Kolkata',
    });
    // ─────────────────────────────────────────
    // Weekly: Clean up old expired refresh tokens
    // Runs every Sunday at 2 AM IST
    // ─────────────────────────────────────────
    node_cron_1.default.schedule('0 2 * * 0', async () => {
        logger_1.logger.info('⏰ Cron: Cleaning expired tokens...');
        try {
            const result = await db_1.prisma.refreshToken.deleteMany({
                where: {
                    OR: [
                        { expiresAt: { lt: new Date() } },
                        { isRevoked: true },
                    ],
                },
            });
            logger_1.logger.info(`✅ Cron: Deleted ${result.count} expired tokens`);
        }
        catch (error) {
            logger_1.logger.error('❌ Cron: Token cleanup failed:', error);
        }
    }, {
        timezone: 'Asia/Kolkata',
    });
    // ─────────────────────────────────────────
    // Weekly: Clean up expired OTP codes
    // Runs every day at 3 AM IST
    // ─────────────────────────────────────────
    node_cron_1.default.schedule('0 3 * * *', async () => {
        try {
            await db_1.prisma.oTPCode.deleteMany({
                where: { OR: [{ expiresAt: { lt: new Date() } }, { isUsed: true }] },
            });
        }
        catch (error) {
            logger_1.logger.error('OTP cleanup failed:', error);
        }
    }, {
        timezone: 'Asia/Kolkata',
    });
    logger_1.logger.info('✅ Cron jobs initialized');
};
exports.initCronJobs = initCronJobs;
//# sourceMappingURL=cronJobs.js.map