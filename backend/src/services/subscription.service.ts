// src/services/subscription.service.ts
// Subscription management + Razorpay integration

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { PlanType, SubscriptionStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import { addDays } from '../utils/helpers';

// Plan amounts in paise (INR * 100)
const PLAN_AMOUNTS: Record<string, number> = {
  NORMAL_100: 10000,      // ₹100
  FREELANCER_200: 20000,  // ₹200
  OWNER_500: 50000,       // ₹500
};

const razorpay = new Razorpay({
  key_id: config.razorpayKeyId,
  key_secret: config.razorpayKeySecret,
});

// ─────────────────────────────────────────
// CREATE RAZORPAY ORDER
// ─────────────────────────────────────────
export const createSubscriptionOrder = async (userId: string, planType: string) => {
  const amount = PLAN_AMOUNTS[planType];
  if (!amount) {
    throw new AppError(`Invalid plan type: ${planType}`, 400);
  }

  try {
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `fitai_${userId}_${Date.now()}`,
      notes: { userId, planType },
    });

    // Store the order ID in subscription
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planType: planType as PlanType,
        status: SubscriptionStatus.trial,
        razorpayOrderId: order.id,
        amount,
      },
      update: { razorpayOrderId: order.id, planType: planType as PlanType, amount },
    });

    return {
      orderId: order.id,
      amount,
      currency: 'INR',
      key: config.razorpayKeyId,
    };
  } catch (error) {
    logger.error('Razorpay order creation failed:', error);
    throw new AppError('Payment order creation failed', 500);
  }
};

// ─────────────────────────────────────────
// RAZORPAY WEBHOOK HANDLER
// ─────────────────────────────────────────
export const handleRazorpayWebhook = async (
  payload: string,
  signature: string,
  body: Record<string, unknown>
): Promise<void> => {
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', config.razorpayWebhookSecret)
    .update(payload)
    .digest('hex');

  if (expectedSignature !== signature) {
    throw new AppError('Invalid webhook signature', 400);
  }

  const event = body.event as string;
  logger.info(`Razorpay webhook received: ${event}`);

  if (event === 'payment.captured') {
    const payment = (body as any).payload?.payment?.entity;
    if (!payment) return;

    const orderId = payment.order_id as string;
    const paymentId = payment.id as string;

    // Find subscription by order ID
    const subscription = await prisma.subscription.findFirst({
      where: { razorpayOrderId: orderId },
    });

    if (!subscription) {
      logger.warn(`Subscription not found for order: ${orderId}`);
      return;
    }

    const now = new Date();
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.active,
        razorpayPaymentId: paymentId,
        currentPeriodStart: now,
        currentPeriodEnd: addDays(now, 30),
        trialEndsAt: null,
      },
    });

    // Send notification
    await prisma.notification.create({
      data: {
        userId: subscription.userId,
        type: 'subscription_expiry',
        title: '✅ Payment Successful!',
        body: `Your ${subscription.planType} subscription is now active. Next billing in 30 days.`,
      },
    });

    logger.info(`Subscription activated for user: ${subscription.userId}`);
  }

  if (event === 'payment.failed') {
    const payment = (body as any).payload?.payment?.entity;
    if (!payment) return;

    const orderId = payment.order_id as string;
    const subscription = await prisma.subscription.findFirst({ where: { razorpayOrderId: orderId } });

    if (subscription) {
      // Keep trial if still valid, otherwise mark as past_due
      const now = new Date();
      const isTrialValid = subscription.trialEndsAt && subscription.trialEndsAt > now;

      if (!isTrialValid && subscription.status !== SubscriptionStatus.trial) {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: SubscriptionStatus.past_due },
        });
      }

      logger.warn(`Payment failed for subscription: ${subscription.id}`);
    }
  }
};

// ─────────────────────────────────────────
// GET SUBSCRIPTION STATUS
// ─────────────────────────────────────────
export const getSubscriptionStatus = async (userId: string) => {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });

  if (!subscription) {
    throw new AppError('No subscription found', 404);
  }

  return {
    status: subscription.status,
    planType: subscription.planType,
    nextBilling: subscription.currentPeriodEnd?.toISOString() ?? null,
    trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
    amount: subscription.amount ? subscription.amount / 100 : null, // Convert back to INR
  };
};

// ─────────────────────────────────────────
// CANCEL SUBSCRIPTION
// ─────────────────────────────────────────
export const cancelSubscription = async (userId: string) => {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });

  if (!subscription) {
    throw new AppError('No subscription found', 404);
  }

  await prisma.subscription.update({
    where: { userId },
    data: {
      status: SubscriptionStatus.cancelled,
      cancelledAt: new Date(),
    },
  });
};

// ─────────────────────────────────────────
// EXPIRE TRIALS (called by cron job)
// ─────────────────────────────────────────
export const expireTrials = async (): Promise<number> => {
  const result = await prisma.subscription.updateMany({
    where: {
      status: SubscriptionStatus.trial,
      trialEndsAt: { lt: new Date() },
    },
    data: { status: SubscriptionStatus.expired },
  });

  if (result.count > 0) {
    logger.info(`Expired ${result.count} trial subscriptions`);

    // Notify expired trial users
    const expiredSubs = await prisma.subscription.findMany({
      where: { status: SubscriptionStatus.expired },
      include: { user: { select: { id: true } } },
    });

    for (const sub of expiredSubs) {
      await prisma.notification.upsert({
        where: { id: `trial_expired_${sub.userId}` },
        create: {
          id: `trial_expired_${sub.userId}`,
          userId: sub.userId,
          type: 'subscription_expiry',
          title: 'Your Free Trial Has Ended 🔔',
          body: 'Subscribe now to continue accessing your personalized AI fitness plans!',
        },
        update: {},
      }).catch(() => {
        // Silently fail if notification already exists
      });
    }
  }

  return result.count;
};
