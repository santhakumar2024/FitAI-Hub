"use strict";
// src/routes/trainer.routes.ts
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
const trainerController = __importStar(require("../controllers/trainer.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect);
// Trainer + Owner: Client management
router.get('/clients', (0, auth_middleware_1.roleGuard)(client_1.Role.TRAINER, client_1.Role.GYM_OWNER), trainerController.getMyClients);
router.get('/clients/:clientId', (0, auth_middleware_1.roleGuard)(client_1.Role.TRAINER, client_1.Role.GYM_OWNER), trainerController.getClientById);
router.get('/clients/:clientId/progress', (0, auth_middleware_1.roleGuard)(client_1.Role.TRAINER, client_1.Role.GYM_OWNER), trainerController.getClientProgress);
router.get('/clients/:clientId/plans', (0, auth_middleware_1.roleGuard)(client_1.Role.TRAINER, client_1.Role.GYM_OWNER), trainerController.getClientPlans);
router.get('/clients/:clientId/logs', (0, auth_middleware_1.roleGuard)(client_1.Role.TRAINER, client_1.Role.GYM_OWNER), trainerController.getClientLogs);
router.get('/clients/:clientId/logs/daily', (0, auth_middleware_1.roleGuard)(client_1.Role.TRAINER, client_1.Role.GYM_OWNER), trainerController.getClientDailyLog);
// Trainer revenue & AI (freelance-focused)
router.get('/trainer/revenue', (0, auth_middleware_1.roleGuard)(client_1.Role.TRAINER), trainerController.getTrainerRevenue);
router.get('/trainer/ai-suggestions', (0, auth_middleware_1.roleGuard)(client_1.Role.TRAINER), trainerController.getTrainerAISuggestions);
// Freelance trainer: Add client by email/phone
router.post('/freelancer/clients', auth_middleware_1.freelanceGuard, trainerController.addFreelanceClient);
// Trainer: Add note for client
router.post('/trainer/note', (0, auth_middleware_1.roleGuard)(client_1.Role.TRAINER), trainerController.addTrainerNote);
exports.default = router;
//# sourceMappingURL=trainer.routes.js.map