// src/routes/logs.routes.ts

import { Router } from 'express';
import * as logsController from '../controllers/logs.controller';
import { protect, subscriptionGuard } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validateRequest';
import { dailyLogSchema } from '../validators/logs.schema';

const router = Router();

router.use(protect, subscriptionGuard);

router.post('/logs/daily', validateBody(dailyLogSchema), logsController.createDailyLog);
router.get('/logs/daily', logsController.getDailyLog);
router.get('/logs/history', logsController.getLogHistory);
router.get('/progress/summary', logsController.getProgressSummary);

export default router;
