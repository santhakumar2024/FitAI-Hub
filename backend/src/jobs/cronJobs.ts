// src/jobs/cronJobs.ts
// Scheduled background jobs with node-cron

import cron from 'node-cron';
import { expireTrials } from '../services/subscription.service';
import { logger } from '../utils/logger';
import { prisma } from '../config/db';

/**
 * Initialize all cron jobs
 */
export const initCronJobs = (): void => {
  // ─────────────────────────────────────────
  // Daily: Check and expire trial subscriptions
  // Runs every day at midnight (IST = UTC+5:30 → UTC 18:30)
  // ─────────────────────────────────────────
  cron.schedule('30 18 * * *', async () => {
    logger.info('⏰ Cron: Checking trial expirations...');
    try {
      const count = await expireTrials();
      logger.info(`✅ Cron: Expired ${count} trials`);
    } catch (error) {
      logger.error('❌ Cron: Trial expiration failed:', error);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  // ─────────────────────────────────────────
  // Daily: Send subscription renewal reminders (3 days before expiry)
  // Runs daily at 9 AM IST
  // ─────────────────────────────────────────
  cron.schedule('0 9 * * *', async () => {
    logger.info('⏰ Cron: Checking subscription renewals due in 3 days...');
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const twoDaysFromNow = new Date();
      twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

      const expiringTrials = await prisma.subscription.findMany({
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
        await prisma.notification.create({
          data: {
            userId: sub.userId,
            type: 'subscription_expiry',
            title: '⚠️ Free Trial Ending in 3 Days!',
            body: 'Subscribe now to keep your personalized AI fitness plans and progress data.',
          },
        });
        logger.info(`Renewal reminder sent to user: ${sub.userId}`);
      }
    } catch (error) {
      logger.error('❌ Cron: Renewal reminder failed:', error);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  // ─────────────────────────────────────────
  // Weekly: Clean up old expired refresh tokens
  // Runs every Sunday at 2 AM IST
  // ─────────────────────────────────────────
  cron.schedule('0 2 * * 0', async () => {
    logger.info('⏰ Cron: Cleaning expired tokens...');
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isRevoked: true },
          ],
        },
      });
      logger.info(`✅ Cron: Deleted ${result.count} expired tokens`);
    } catch (error) {
      logger.error('❌ Cron: Token cleanup failed:', error);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  // ─────────────────────────────────────────
  // Weekly: Clean up expired OTP codes
  // Runs every day at 3 AM IST
  // ─────────────────────────────────────────
  cron.schedule('0 3 * * *', async () => {
    try {
      await prisma.oTPCode.deleteMany({
        where: { OR: [{ expiresAt: { lt: new Date() } }, { isUsed: true }] },
      });
    } catch (error) {
      logger.error('OTP cleanup failed:', error);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  logger.info('✅ Cron jobs initialized');
};
