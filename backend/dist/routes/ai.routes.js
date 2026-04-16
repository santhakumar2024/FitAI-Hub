"use strict";
// src/routes/ai.routes.ts
// AI plan routes
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiController = __importStar(require("../controllers/ai.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const validateRequest_1 = require("../middleware/validateRequest");
const plan_schema_1 = require("../validators/plan.schema");
const client_1 = require("@prisma/client");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
// AI generation is rate-limited to prevent abuse
const aiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { success: false, message: 'AI plan generation limit reached. Try again in 1 hour.' },
});
// All routes require auth + active subscription
router.use(auth_middleware_1.protect, auth_middleware_1.subscriptionGuard);
// AI Plan Generation
router.post('/ai/generate-plan', aiLimiter, (0, validateRequest_1.validateBody)(plan_schema_1.generatePlanSchema), aiController.generatePlan);
// AI Calorie Estimation
router.post('/ai/estimate-calories', aiController.estimateCalories);
// AI Single Food Nutrition Scan
router.post('/ai/estimate-food', aiController.estimateFoodNutrition);
// Plan CRUD
router.get('/plan/today', aiController.getTodayPlan);
router.get('/plan/date', aiController.getPlanByDate);
router.get('/plan/history', aiController.getPlanHistory);
router.get('/plan/:planId', aiController.getPlanById);
// Trainer: Manual override
router.patch('/plan/:planId/override', (0, auth_middleware_1.roleGuard)(client_1.Role.TRAINER, client_1.Role.GYM_OWNER), (0, validateRequest_1.validateBody)(plan_schema_1.overridePlanSchema), aiController.overridePlan);
// Trainer/Owner: View client plan
router.get('/plan/client/:clientId/current', (0, auth_middleware_1.roleGuard)(client_1.Role.TRAINER, client_1.Role.GYM_OWNER), aiController.getClientCurrentPlan);
exports.default = router;
//# sourceMappingURL=ai.routes.js.map