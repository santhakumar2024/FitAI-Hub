// src/routes/gym.routes.ts
// Gym management routes — updated for multi-gym support

import { Router } from 'express';
import * as gymController from '../controllers/gym.controller';
import { protect, roleGuard } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(protect);

// Apply role guard specifically to gym management routes
const gymOwnerGuard = roleGuard(Role.GYM_OWNER);

// ─── Base Gym Management ──────────────────────────────────────────────────────
router.post('/gym', gymOwnerGuard, gymController.createGym);      // Create a gym
router.get('/gym', gymOwnerGuard, gymController.getMyGyms);       // List all my gyms
router.get('/gym/:gymId', gymOwnerGuard, gymController.getGymDetails); // Specific gym info
router.patch('/gym/:gymId', gymOwnerGuard, gymController.updateGym);  // Update specific gym

// ─── Sub-resources for specific gym ──────────────────────────────────────────
router.get('/gym/:gymId/stats', gymOwnerGuard, gymController.getGymStats);
router.get('/gym/:gymId/revenue', gymOwnerGuard, gymController.getGymRevenue);
router.get('/gym/:gymId/ai-suggestions', gymOwnerGuard, gymController.getGymAISuggestions);

// Trainers
router.post('/gym/:gymId/trainers', gymOwnerGuard, gymController.addTrainerToGym);
router.get('/gym/:gymId/trainers', gymOwnerGuard, gymController.getGymTrainers);
router.delete('/gym/:gymId/trainers/:trainerId', gymOwnerGuard, gymController.removeTrainerFromGym);

// Members & Assignments
router.get('/gym/:gymId/members', gymOwnerGuard, gymController.getGymMembers);
router.post('/gym/:gymId/members', gymOwnerGuard, gymController.addGymMember);
router.post('/gym/:gymId/assign-client', gymOwnerGuard, gymController.assignClientToTrainer);
router.delete('/gym/:gymId/clients/:clientId/assign', gymOwnerGuard, gymController.unassignClient);

export default router;
