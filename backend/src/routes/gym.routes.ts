// src/routes/gym.routes.ts

import { Router } from 'express';
import * as gymController from '../controllers/gym.controller';
import { protect, roleGuard } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

// Apply role guard specifically to gym management routes
const gymOwnerGuard = roleGuard(Role.GYM_OWNER);

router.post('/gym', gymOwnerGuard, gymController.createGym);
router.get('/gym', gymOwnerGuard, gymController.getMyGym);
router.patch('/gym', gymOwnerGuard, gymController.updateGym);
router.get('/gym/stats', gymOwnerGuard, gymController.getGymStats);
router.get('/gym/revenue', gymOwnerGuard, gymController.getGymRevenue);
router.get('/gym/ai-suggestions', gymOwnerGuard, gymController.getGymAISuggestions);

router.post('/gym/trainers', gymOwnerGuard, gymController.addTrainerToGym);
router.get('/gym/trainers', gymOwnerGuard, gymController.getGymTrainers);
router.delete('/gym/trainers/:trainerId', gymOwnerGuard, gymController.removeTrainerFromGym);

router.get('/gym/members', gymOwnerGuard, gymController.getGymMembers);
router.post('/gym/members', gymOwnerGuard, gymController.addGymMember);
router.post('/gym/assign-client', gymOwnerGuard, gymController.assignClientToTrainer);
router.delete('/clients/:clientId/assign', gymOwnerGuard, gymController.unassignClient);

export default router;

