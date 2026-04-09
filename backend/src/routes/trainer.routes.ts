// src/routes/trainer.routes.ts

import { Router } from 'express';
import * as trainerController from '../controllers/trainer.controller';
import { protect, roleGuard, freelanceGuard } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

// Trainer + Owner: Client management
router.get('/clients', roleGuard(Role.TRAINER, Role.GYM_OWNER), trainerController.getMyClients);
router.get('/clients/:clientId', roleGuard(Role.TRAINER, Role.GYM_OWNER), trainerController.getClientById);
router.get('/clients/:clientId/progress', roleGuard(Role.TRAINER, Role.GYM_OWNER), trainerController.getClientProgress);
router.get('/clients/:clientId/plans', roleGuard(Role.TRAINER, Role.GYM_OWNER), trainerController.getClientPlans);
router.get('/clients/:clientId/logs', roleGuard(Role.TRAINER, Role.GYM_OWNER), trainerController.getClientLogs);
router.get('/clients/:clientId/logs/daily', roleGuard(Role.TRAINER, Role.GYM_OWNER), trainerController.getClientDailyLog);

// Trainer revenue & AI (freelance-focused)
router.get('/trainer/revenue', roleGuard(Role.TRAINER), trainerController.getTrainerRevenue);
router.get('/trainer/ai-suggestions', roleGuard(Role.TRAINER), trainerController.getTrainerAISuggestions);

// Freelance trainer: Add client by email/phone
router.post('/freelancer/clients', freelanceGuard, trainerController.addFreelanceClient);

// Trainer: Add note for client
router.post('/trainer/note', roleGuard(Role.TRAINER), trainerController.addTrainerNote);

export default router;

