"use strict";
// src/services/subscription.service.ts
// Subscription management + Razorpay integration
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireTrials = exports.cancelSubscription = exports.getSubscriptionStatus = exports.handleRazorpayWebhook = exports.createSubscriptionOrder = void 0;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = require("../config/db");
const env_1 = require("../config/env");
const errorHandler_1 = require("../middleware/errorHandler");
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const helpers_1 = require("../utils/helpers");
// Plan amounts in paise (INR * 100)
const PLAN_AMOUNTS = {
    NORMAL_100: 10000, // ₹100
    FREELANCER_200: 20000, // ₹200
    OWNER_500: 50000, // ₹500
};
const razorpay = new razorpay_1.default({
    key_id: env_1.config.razorpayKeyId,
    key_secret: env_1.config.razorpayKeySecret,
});
// ─────────────────────────────────────────
// CREATE RAZORPAY ORDER
// ─────────────────────────────────────────
const createSubscriptionOrder = async (userId, planType, gymId) => {
    const amount = PLAN_AMOUNTS[planType];
    if (!amount) {
        throw new errorHandler_1.AppError(`Invalid plan type: ${planType}`, 400);
    }
    try {
        const order = await razorpay.orders.create({
            amount,
            currency: 'INR',
            receipt: `fitai_${userId}_${gymId || 'user'}_${Date.now()}`,
            notes: { userId, planType, gymId: gymId || '' },
        });
        // Store the order ID in subscription
        if (gymId) {
            // Gym-level subscription
            await db_1.prisma.subscription.upsert({
                where: { gymId },
                create: {
                    userId,
                    gymId,
                    planType: planType,
                    status: client_1.SubscriptionStatus.trial,
                    razorpayOrderId: order.id,
                    amount,
                },
                update: { razorpayOrderId: order.id, planType: planType, amount },
            });
        }
        else {
            // User-level subscription (Check for existing non-gym subscription)
            const existingUserSub = await db_1.prisma.subscription.findFirst({
                where: { userId, gymId: null }
            });
            if (existingUserSub) {
                await db_1.prisma.subscription.update({
                    where: { id: existingUserSub.id },
                    data: { razorpayOrderId: order.id, planType: planType, amount }
                });
            }
            else {
                await db_1.prisma.subscription.create({
                    data: {
                        userId,
                        planType: planType,
                        status: client_1.SubscriptionStatus.trial,
                        razorpayOrderId: order.id,
                        amount,
                    }
                });
            }
        }
        return {
            orderId: order.id,
            amount,
            currency: 'INR',
            key: env_1.config.razorpayKeyId,
        };
    }
    catch (error) {
        logger_1.logger.error('Razorpay order creation failed:', error);
        throw new errorHandler_1.AppError('Payment order creation failed', 500);
    }
};
exports.createSubscriptionOrder = createSubscriptionOrder;
// ─────────────────────────────────────────
// RAZORPAY WEBHOOK HANDLER
// ─────────────────────────────────────────
const handleRazorpayWebhook = async (payload, signature, body) => {
    // Verify webhook signature
    const expectedSignature = crypto_1.default
        .createHmac('sha256', env_1.config.razorpayWebhookSecret)
        .update(payload)
        .digest('hex');
    if (expectedSignature !== signature) {
        throw new errorHandler_1.AppError('Invalid webhook signature', 400);
    }
    const event = body.event;
    logger_1.logger.info(`Razorpay webhook received: ${event}`);
    if (event === 'payment.captured') {
        const payment = body.payload?.payment?.entity;
        if (!payment)
            return;
        const orderId = payment.order_id;
        const paymentId = payment.id;
        // Find subscription by order ID
        const subscription = await db_1.prisma.subscription.findFirst({
            where: { razorpayOrderId: orderId },
        });
        if (!subscription) {
            logger_1.logger.warn(`Subscription not found for order: ${orderId}`);
            return;
        }
        const now = new Date();
        await db_1.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                status: client_1.SubscriptionStatus.active,
                razorpayPaymentId: paymentId,
                currentPeriodStart: now,
                currentPeriodEnd: (0, helpers_1.addDays)(now, 30),
                trialEndsAt: null,
            },
        });
        // Send notification
        await db_1.prisma.notification.create({
            data: {
                userId: subscription.userId,
                type: 'subscription_expiry',
                title: '✅ Payment Successful!',
                body: `Your ${subscription.planType} subscription is now active. Next billing in 30 days.`,
            },
        });
        logger_1.logger.info(`Subscription activated for user: ${subscription.userId}`);
    }
    if (event === 'payment.failed') {
        const payment = body.payload?.payment?.entity;
        if (!payment)
            return;
        const orderId = payment.order_id;
        const subscription = await db_1.prisma.subscription.findFirst({ where: { razorpayOrderId: orderId } });
        if (subscription) {
            // Keep trial if still valid, otherwise mark as past_due
            const now = new Date();
            const isTrialValid = subscription.trialEndsAt && subscription.trialEndsAt > now;
            if (!isTrialValid && subscription.status !== client_1.SubscriptionStatus.trial) {
                await db_1.prisma.subscription.update({
                    where: { id: subscription.id },
                    data: { status: client_1.SubscriptionStatus.past_due },
                });
            }
            logger_1.logger.warn(`Payment failed for subscription: ${subscription.id}`);
        }
    }
};
exports.handleRazorpayWebhook = handleRazorpayWebhook;
// ─────────────────────────────────────────
// GET SUBSCRIPTION STATUS
// ─────────────────────────────────────────
const getSubscriptionStatus = async (userId, gymId) => {
    const subscription = await db_1.prisma.subscription.findFirst({
        where: gymId ? { gymId } : { userId, gymId: null }
    });
    if (!subscription) {
        throw new errorHandler_1.AppError('No subscription found', 404);
    }
    return {
        status: subscription.status,
        planType: subscription.planType,
        nextBilling: subscription.currentPeriodEnd?.toISOString() ?? null,
        trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
        amount: subscription.amount ? subscription.amount / 100 : null, // Convert back to INR
    };
};
exports.getSubscriptionStatus = getSubscriptionStatus;
// ─────────────────────────────────────────
// CANCEL SUBSCRIPTION
// ─────────────────────────────────────────
const cancelSubscription = async (userId, gymId) => {
    const subscription = await db_1.prisma.subscription.findFirst({
        where: gymId ? { gymId } : { userId, gymId: null }
    });
    if (!subscription) {
        throw new errorHandler_1.AppError('No subscription found', 404);
    }
    await db_1.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
            status: client_1.SubscriptionStatus.cancelled,
            cancelledAt: new Date(),
        },
    });
};
exports.cancelSubscription = cancelSubscription;
// ─────────────────────────────────────────
// EXPIRE TRIALS (called by cron job)
// ─────────────────────────────────────────
const expireTrials = async () => {
    const result = await db_1.prisma.subscription.updateMany({
        where: {
            status: client_1.SubscriptionStatus.trial,
            trialEndsAt: { lt: new Date() },
        },
        data: { status: client_1.SubscriptionStatus.expired },
    });
    if (result.count > 0) {
        logger_1.logger.info(`Expired ${result.count} trial subscriptions`);
        // Notify expired trial users
        const expiredSubs = await db_1.prisma.subscription.findMany({
            where: { status: client_1.SubscriptionStatus.expired },
            include: { user: { select: { id: true } } },
        });
        for (const sub of expiredSubs) {
            await db_1.prisma.notification.upsert({
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
exports.expireTrials = expireTrials;
//# sourceMappingURL=subscription.service.js.map