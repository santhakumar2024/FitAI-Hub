// src/routes/subscription.routes.ts
import { Router } from 'express';
import * as subController from '../controllers/subscription.controller';
import { protect } from '../middleware/auth.middleware';
import express from 'express';

const router = Router();

// Webhook: No auth (Razorpay calls this directly)
router.post('/subscription/webhook', express.raw({ type: 'application/json' }), subController.webhookHandler);

// Protected routes
router.use(protect);
router.post('/subscription/create-order', subController.createOrder);
router.get('/subscription/status', subController.getStatus);
router.post('/subscription/cancel', subController.cancelSubscription);

export default router;
