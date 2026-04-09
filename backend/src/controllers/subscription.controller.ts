// src/controllers/subscription.controller.ts
// Subscription and billing endpoints

import { Request, Response, NextFunction } from 'express';
import * as subscriptionService from '../services/subscription.service';
import { ok, badRequest } from '../utils/apiResponse';

export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { planType } = req.body;

    if (!planType) {
      badRequest(res, 'planType is required');
      return;
    }

    const order = await subscriptionService.createSubscriptionOrder(userId, planType);
    ok(res, 'Order created', order);
  } catch (error) {
    next(error);
  }
};

export const webhookHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const payload = JSON.stringify(req.body);

    await subscriptionService.handleRazorpayWebhook(payload, signature, req.body as Record<string, unknown>);
    ok(res, 'Webhook processed');
  } catch (error) {
    next(error);
  }
};

export const getStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = await subscriptionService.getSubscriptionStatus(req.user!.userId);
    ok(res, 'Subscription status retrieved', status);
  } catch (error) {
    next(error);
  }
};

export const cancelSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await subscriptionService.cancelSubscription(req.user!.userId);
    ok(res, 'Subscription cancelled. You will retain access until the current period ends.');
  } catch (error) {
    next(error);
  }
};
