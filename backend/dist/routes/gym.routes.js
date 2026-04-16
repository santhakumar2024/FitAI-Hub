"use strict";
// src/routes/gym.routes.ts
// Gym management routes — updated for multi-gym support
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
const express_1 = require("express");
const gymController = __importStar(require("../controllers/gym.controller"));
const membershipController = __importStar(require("../controllers/membership.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
// Apply role guard specifically to gym management routes
const gymOwnerGuard = (0, auth_middleware_1.roleGuard)(client_1.Role.GYM_OWNER);
// ─── Base Gym Management ──────────────────────────────────────────────────────
router.post('/gym', gymOwnerGuard, gymController.createGym); // Create a gym
router.get('/gym', gymOwnerGuard, gymController.getMyGyms); // List all my gyms
router.get('/gym/:gymId', gymOwnerGuard, gymController.getGymDetails); // Specific gym info
router.patch('/gym/:gymId', gymOwnerGuard, gymController.updateGym); // Update specific gym
// ─── Sub-resources for specific gym ──────────────────────────────────────────
router.get('/gym/:gymId/stats', gymOwnerGuard, auth_middleware_1.subscriptionGuard, gymController.getGymStats);
router.get('/gym/:gymId/revenue', gymOwnerGuard, auth_middleware_1.subscriptionGuard, gymController.getGymRevenue);
router.get('/gym/:gymId/ai-suggestions', gymOwnerGuard, auth_middleware_1.subscriptionGuard, gymController.getGymAISuggestions);
// Membership Plans
router.get('/gym/:gymId/plans', gymOwnerGuard, auth_middleware_1.subscriptionGuard, membershipController.getGymPlans);
router.patch('/gym/:gymId/plans/:planId', gymOwnerGuard, auth_middleware_1.subscriptionGuard, membershipController.updateGymPlan);
router.post('/gym/:gymId/members/:memberId/membership', gymOwnerGuard, auth_middleware_1.subscriptionGuard, membershipController.assignMemberPlan);
router.get('/gym/:gymId/members/:memberId/membership', gymOwnerGuard, auth_middleware_1.subscriptionGuard, membershipController.getMemberMembership);
// Trainers
router.post('/gym/:gymId/trainers', gymOwnerGuard, auth_middleware_1.subscriptionGuard, gymController.addTrainerToGym);
router.get('/gym/:gymId/trainers', gymOwnerGuard, auth_middleware_1.subscriptionGuard, gymController.getGymTrainers);
router.delete('/gym/:gymId/trainers/:trainerId', gymOwnerGuard, auth_middleware_1.subscriptionGuard, gymController.removeTrainerFromGym);
// Members & Assignments
router.get('/gym/:gymId/members', gymOwnerGuard, auth_middleware_1.subscriptionGuard, gymController.getGymMembers);
router.post('/gym/:gymId/members', gymOwnerGuard, auth_middleware_1.subscriptionGuard, gymController.addGymMember);
router.post('/gym/:gymId/assign-client', gymOwnerGuard, auth_middleware_1.subscriptionGuard, gymController.assignClientToTrainer);
router.delete('/gym/:gymId/clients/:clientId/assign', gymOwnerGuard, auth_middleware_1.subscriptionGuard, gymController.unassignClient);
exports.default = router;
//# sourceMappingURL=gym.routes.js.map