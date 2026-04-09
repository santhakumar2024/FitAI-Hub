// src/routes/gym.routes.ts
// Gym management routes — updated for multi-gym support

import { Router } from 'express';
import * as gymController from '../controllers/gym.controller';
import * as membershipController from '../controllers/membership.controller';
import { protect, roleGuard, subscriptionGuard } from '../middleware/auth.middleware';
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
router.get('/gym/:gymId/stats', gymOwnerGuard, subscriptionGuard, gymController.getGymStats);
router.get('/gym/:gymId/revenue', gymOwnerGuard, subscriptionGuard, gymController.getGymRevenue);
router.get('/gym/:gymId/ai-suggestions', gymOwnerGuard, subscriptionGuard, gymController.getGymAISuggestions);

// Membership Plans
router.get('/gym/:gymId/plans', gymOwnerGuard, subscriptionGuard, membershipController.getGymPlans);
router.patch('/gym/:gymId/plans/:planId', gymOwnerGuard, subscriptionGuard, membershipController.updateGymPlan);
router.post('/gym/:gymId/members/:memberId/membership', gymOwnerGuard, subscriptionGuard, membershipController.assignMemberPlan);
router.get('/gym/:gymId/members/:memberId/membership', gymOwnerGuard, subscriptionGuard, membershipController.getMemberMembership);

// Trainers
router.post('/gym/:gymId/trainers', gymOwnerGuard, subscriptionGuard, gymController.addTrainerToGym);
router.get('/gym/:gymId/trainers', gymOwnerGuard, subscriptionGuard, gymController.getGymTrainers);
router.delete('/gym/:gymId/trainers/:trainerId', gymOwnerGuard, subscriptionGuard, gymController.removeTrainerFromGym);

// Members & Assignments
router.get('/gym/:gymId/members', gymOwnerGuard, subscriptionGuard, gymController.getGymMembers);
router.post('/gym/:gymId/members', gymOwnerGuard, subscriptionGuard, gymController.addGymMember);
router.post('/gym/:gymId/assign-client', gymOwnerGuard, subscriptionGuard, gymController.assignClientToTrainer);
router.delete('/gym/:gymId/clients/:clientId/assign', gymOwnerGuard, subscriptionGuard, gymController.unassignClient);

export default router;
