"use strict";
// src/controllers/subscription.controller.ts
// Subscription and billing endpoints
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelSubscription = exports.getStatus = exports.webhookHandler = exports.createOrder = void 0;
const subscriptionService = __importStar(require("../services/subscription.service"));
const apiResponse_1 = require("../utils/apiResponse");
const createOrder = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { planType } = req.body;
        if (!planType) {
            (0, apiResponse_1.badRequest)(res, 'planType is required');
            return;
        }
        const order = await subscriptionService.createSubscriptionOrder(userId, planType);
        (0, apiResponse_1.ok)(res, 'Order created', order);
    }
    catch (error) {
        next(error);
    }
};
exports.createOrder = createOrder;
const webhookHandler = async (req, res, next) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const payload = JSON.stringify(req.body);
        await subscriptionService.handleRazorpayWebhook(payload, signature, req.body);
        (0, apiResponse_1.ok)(res, 'Webhook processed');
    }
    catch (error) {
        next(error);
    }
};
exports.webhookHandler = webhookHandler;
const getStatus = async (req, res, next) => {
    try {
        const status = await subscriptionService.getSubscriptionStatus(req.user.userId);
        (0, apiResponse_1.ok)(res, 'Subscription status retrieved', status);
    }
    catch (error) {
        next(error);
    }
};
exports.getStatus = getStatus;
const cancelSubscription = async (req, res, next) => {
    try {
        await subscriptionService.cancelSubscription(req.user.userId);
        (0, apiResponse_1.ok)(res, 'Subscription cancelled. You will retain access until the current period ends.');
    }
    catch (error) {
        next(error);
    }
};
exports.cancelSubscription = cancelSubscription;
//# sourceMappingURL=subscription.controller.js.map