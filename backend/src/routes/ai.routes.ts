// src/routes/ai.routes.ts
// AI plan routes

import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { protect, roleGuard, subscriptionGuard } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validateRequest';
import { generatePlanSchema, overridePlanSchema } from '../validators/plan.schema';
import { Role } from '@prisma/client';
import rateLimit from 'express-rate-limit';

const router = Router();

// AI generation is rate-limited to prevent abuse
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'AI plan generation limit reached. Try again in 1 hour.' },
});

// All routes require auth + active subscription
router.use(protect, subscriptionGuard);

// AI Plan Generation
router.post('/ai/generate-plan', aiLimiter, validateBody(generatePlanSchema), aiController.generatePlan);

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
router.patch(
  '/plan/:planId/override',
  roleGuard(Role.TRAINER, Role.GYM_OWNER),
  validateBody(overridePlanSchema),
  aiController.overridePlan
);

// Trainer/Owner: View client plan
router.get(
  '/plan/client/:clientId/current',
  roleGuard(Role.TRAINER, Role.GYM_OWNER),
  aiController.getClientCurrentPlan
);

export default router;
