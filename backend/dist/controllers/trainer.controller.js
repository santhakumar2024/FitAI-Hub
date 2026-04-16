"use strict";
// src/controllers/trainer.controller.ts
// Trainer and client management endpoints
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
exports.getTrainerAISuggestions = exports.getTrainerRevenue = exports.getClientDailyLog = exports.getClientLogs = exports.addTrainerNote = exports.addFreelanceClient = exports.getClientPlans = exports.getClientProgress = exports.getClientById = exports.getMyClients = void 0;
const db_1 = require("../config/db");
const apiResponse_1 = require("../utils/apiResponse");
const helpers_1 = require("../utils/helpers");
const client_1 = require("@prisma/client");
// ─────────────────────────────────────────
// GET /clients (Trainer: list my clients)
// ─────────────────────────────────────────
const getMyClients = async (req, res, next) => {
    try {
        const trainerId = req.user.userId;
        const { search, page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const whereClause = { trainerId, isActive: true };
        if (search) {
            whereClause.client = {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            };
        }
        const [relations, total] = await Promise.all([
            db_1.prisma.clientTrainer.findMany({
                where: whereClause,
                skip,
                take: Number(limit),
                include: {
                    client: {
                        select: {
                            id: true, name: true, email: true, phone: true, age: true, gender: true,
                            bmi: true, weight: true, height: true, goals: true, photoUrl: true,
                            subscriptions: { select: { status: true, planType: true }, take: 1, orderBy: { createdAt: 'desc' } },
                        },
                    },
                },
            }),
            db_1.prisma.clientTrainer.count({ where: whereClause }),
        ]);
        const clients = relations.map((r) => ({
            ...r.client,
            subscriptionStatus: r.client.subscriptions[0]?.status,
            assignedAt: r.assignedAt
        }));
        (0, apiResponse_1.ok)(res, 'Clients retrieved', clients, (0, helpers_1.buildPaginationMeta)(total, Number(page), Number(limit)));
    }
    catch (error) {
        next(error);
    }
};
exports.getMyClients = getMyClients;
// ─────────────────────────────────────────
// GET /clients/:clientId (Client details)
// ─────────────────────────────────────────
const getClientById = async (req, res, next) => {
    try {
        const trainerId = req.user.userId;
        const { clientId } = req.params;
        // Verify trainer has access to this client
        const relation = await db_1.prisma.clientTrainer.findFirst({
            where: { clientId, trainerId, isActive: true },
        });
        if (!relation && req.user.role !== client_1.Role.GYM_OWNER) {
            (0, apiResponse_1.forbidden)(res, 'Not assigned to this client');
            return;
        }
        const client = await db_1.prisma.user.findUnique({
            where: { id: clientId },
            select: {
                id: true, name: true, email: true, phone: true, age: true, gender: true,
                height: true, weight: true, bmi: true, goals: true, medicalConditions: true,
                activityLevel: true, photoUrl: true, createdAt: true,
                subscriptions: { select: { status: true, planType: true, trialEndsAt: true }, take: 1, orderBy: { createdAt: 'desc' } },
                aiPlans: {
                    where: { isActive: true },
                    select: { id: true, version: true, isManuallyEdited: true, generatedAt: true },
                    take: 1,
                },
            },
        });
        if (!client) {
            (0, apiResponse_1.notFound)(res, 'Client not found');
            return;
        }
        (0, apiResponse_1.ok)(res, 'Client details retrieved', {
            ...client,
            subscriptionStatus: client.subscriptions[0]?.status,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getClientById = getClientById;
// ─────────────────────────────────────────
// GET /clients/:clientId/progress
// ─────────────────────────────────────────
const getClientProgress = async (req, res, next) => {
    try {
        const trainerId = req.user.userId;
        const { clientId } = req.params;
        const relation = await db_1.prisma.clientTrainer.findFirst({
            where: { clientId, trainerId, isActive: true },
        });
        if (!relation && req.user.role !== client_1.Role.GYM_OWNER) {
            (0, apiResponse_1.forbidden)(res, 'Not assigned to this client');
            return;
        }
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const logs = await db_1.prisma.progressLog.findMany({
            where: { userId: clientId, date: { gte: thirtyDaysAgo } },
            orderBy: { date: 'desc' },
            include: { dietLog: true, workoutLogs: true, yogaLogs: true },
        });
        const notes = await db_1.prisma.trainerNote.findMany({
            where: { clientId, trainerId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        (0, apiResponse_1.ok)(res, 'Client progress retrieved', { logs, notes, totalLogs: logs.length });
    }
    catch (error) {
        next(error);
    }
};
exports.getClientProgress = getClientProgress;
// ─────────────────────────────────────────
// GET /clients/:clientId/plans
// ─────────────────────────────────────────
const getClientPlans = async (req, res, next) => {
    try {
        const { clientId } = req.params;
        const trainerId = req.user.userId;
        const relation = await db_1.prisma.clientTrainer.findFirst({
            where: { clientId, trainerId, isActive: true },
        });
        if (!relation && req.user.role !== client_1.Role.GYM_OWNER) {
            (0, apiResponse_1.forbidden)(res, 'Not assigned to this client');
            return;
        }
        const plans = await db_1.prisma.aIPlan.findMany({
            where: { userId: clientId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, version: true, isManuallyEdited: true, isActive: true,
                generatedAt: true, editReason: true, durationDays: true,
                editedBy: { select: { name: true } },
            },
        });
        (0, apiResponse_1.ok)(res, 'Client plans retrieved', plans);
    }
    catch (error) {
        next(error);
    }
};
exports.getClientPlans = getClientPlans;
// ─────────────────────────────────────────
// POST /freelancer/clients (Freelance trainer adds client by email/phone)
// ─────────────────────────────────────────
const addFreelanceClient = async (req, res, next) => {
    try {
        const trainerId = req.user.userId;
        const { clientEmail, clientPhone } = req.body;
        if (!clientEmail && !clientPhone) {
            (0, apiResponse_1.forbidden)(res, 'Provide either clientEmail or clientPhone');
            return;
        }
        const client = await db_1.prisma.user.findFirst({
            where: {
                OR: [
                    ...(clientEmail ? [{ email: clientEmail }] : []),
                    ...(clientPhone ? [{ phone: clientPhone }] : []),
                ],
                role: client_1.Role.NORMAL_USER,
            },
        });
        if (!client) {
            (0, apiResponse_1.notFound)(res, 'User not found. Ask them to register on FitAI Hub first.');
            return;
        }
        // Check if already assigned
        const existing = await db_1.prisma.clientTrainer.findFirst({
            where: { clientId: client.id, trainerId, isActive: true },
        });
        if (existing) {
            (0, apiResponse_1.conflict)(res, 'Client already in your list');
            return;
        }
        const relation = await db_1.prisma.clientTrainer.create({
            data: { clientId: client.id, trainerId },
        });
        // Notify client
        const trainer = await db_1.prisma.user.findUnique({ where: { id: trainerId }, select: { name: true } });
        await db_1.prisma.notification.create({
            data: {
                userId: client.id,
                type: 'trainer_note',
                title: '🏋️ New Trainer Assigned!',
                body: `${trainer?.name} has added you as a client on FitAI Hub.`,
            },
        });
        (0, apiResponse_1.created)(res, 'Client added successfully', { clientId: client.id, clientName: client.name });
    }
    catch (error) {
        next(error);
    }
};
exports.addFreelanceClient = addFreelanceClient;
// ─────────────────────────────────────────
// POST /trainer/note
// ─────────────────────────────────────────
const addTrainerNote = async (req, res, next) => {
    try {
        const trainerId = req.user.userId;
        const { clientId, note } = req.body;
        const relation = await db_1.prisma.clientTrainer.findFirst({
            where: { clientId, trainerId, isActive: true },
        });
        if (!relation) {
            (0, apiResponse_1.forbidden)(res, 'Not assigned to this client');
            return;
        }
        const trainerNote = await db_1.prisma.trainerNote.create({
            data: { trainerId, clientId, note },
        });
        // Notify client
        await db_1.prisma.notification.create({
            data: {
                userId: clientId,
                type: 'trainer_note',
                title: '📝 New Note From Your Trainer',
                body: note.length > 80 ? `${note.substring(0, 80)}...` : note,
            },
        });
        (0, apiResponse_1.created)(res, 'Note added', trainerNote);
    }
    catch (error) {
        next(error);
    }
};
exports.addTrainerNote = addTrainerNote;
// ─────────────────────────────────────────
// GET /trainer/clients/:clientId/logs (Client log history for calendar)
// ─────────────────────────────────────────
const getClientLogs = async (req, res, next) => {
    try {
        const trainerId = req.user.userId;
        const { clientId } = req.params;
        const { limit = 60 } = req.query;
        const relation = await db_1.prisma.clientTrainer.findFirst({
            where: { clientId, trainerId, isActive: true },
        });
        if (!relation && req.user.role !== client_1.Role.GYM_OWNER) {
            (0, apiResponse_1.forbidden)(res, 'Not assigned to this client');
            return;
        }
        const logs = await db_1.prisma.progressLog.findMany({
            where: { userId: clientId },
            orderBy: { date: 'desc' },
            take: Number(limit),
            select: { id: true, date: true, notes: true },
        });
        (0, apiResponse_1.ok)(res, 'Client logs retrieved', logs);
    }
    catch (error) {
        next(error);
    }
};
exports.getClientLogs = getClientLogs;
// ─────────────────────────────────────────
// GET /trainer/clients/:clientId/logs/daily (Single-day detail)
// ─────────────────────────────────────────
const getClientDailyLog = async (req, res, next) => {
    try {
        const trainerId = req.user.userId;
        const { clientId } = req.params;
        const { date } = req.query;
        const relation = await db_1.prisma.clientTrainer.findFirst({
            where: { clientId, trainerId, isActive: true },
        });
        if (!relation && req.user.role !== client_1.Role.GYM_OWNER) {
            (0, apiResponse_1.forbidden)(res, 'Not assigned to this client');
            return;
        }
        const targetDate = date ? new Date(date) : new Date();
        const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const dayEnd = new Date(dayStart.getTime() + 86400000 - 1);
        const log = await db_1.prisma.progressLog.findFirst({
            where: { userId: clientId, date: { gte: dayStart, lte: dayEnd } },
            include: { dietLog: true, workoutLogs: true, yogaLogs: true },
        });
        (0, apiResponse_1.ok)(res, 'Client daily log retrieved', log);
    }
    catch (error) {
        next(error);
    }
};
exports.getClientDailyLog = getClientDailyLog;
// ─────────────────────────────────────────
// GET /trainer/revenue (Freelance trainer revenue stats)
// ─────────────────────────────────────────
const getTrainerRevenue = async (req, res, next) => {
    try {
        const trainerId = req.user.userId;
        const trainer = await db_1.prisma.user.findUnique({
            where: { id: trainerId },
            select: { name: true, gymId: true },
        });
        if (!trainer) {
            (0, apiResponse_1.notFound)(res, 'Trainer not found');
            return;
        }
        const [totalClients, activeClients] = await Promise.all([
            db_1.prisma.clientTrainer.count({ where: { trainerId } }),
            db_1.prisma.clientTrainer.count({ where: { trainerId, isActive: true } }),
        ]);
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const count = await db_1.prisma.clientTrainer.count({
                where: { trainerId, assignedAt: { gte: start, lte: end } },
            });
            months.push({ month: start.toLocaleString('default', { month: 'short' }), clients: count });
        }
        const sessionFeePerClient = 3000;
        const estimatedRevenue = activeClients * sessionFeePerClient;
        const estimatedExpenditure = 2000;
        const profit = estimatedRevenue - estimatedExpenditure;
        (0, apiResponse_1.ok)(res, 'Trainer revenue retrieved', {
            trainerName: trainer.name,
            isFreelance: !trainer.gymId,
            totalClients,
            activeClients,
            estimatedRevenue,
            estimatedExpenditure,
            profit,
            isProfit: profit >= 0,
            monthlyTrends: months,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTrainerRevenue = getTrainerRevenue;
// ─────────────────────────────────────────
// GET /trainer/ai-suggestions (Freelance trainer AI suggestions)
// ─────────────────────────────────────────
const getTrainerAISuggestions = async (req, res, next) => {
    try {
        const trainerId = req.user.userId;
        const { generateQuickTip } = await Promise.resolve().then(() => __importStar(require('../services/ai.service')));
        const [totalClients, activeClients] = await Promise.all([
            db_1.prisma.clientTrainer.count({ where: { trainerId } }),
            db_1.prisma.clientTrainer.count({ where: { trainerId, isActive: true } }),
        ]);
        const revenueEstimate = activeClients * 3000;
        const profit = revenueEstimate - 2000;
        const prompt = `You are a fitness business consultant AI. Analyze this personal trainer's data and provide 3-4 specific, actionable suggestions to grow their business.\n\nTotal Clients: ${totalClients}\nActive Clients: ${activeClients}\nEstimated Monthly Revenue: ₹${revenueEstimate}\nEstimated Profit: ₹${profit} (${profit >= 0 ? 'PROFIT' : 'LOSS'})\n\nProvide insights about: client retention, marketing, pricing strategies, and service expansion. Keep each point concise (1-2 sentences). Format as a numbered list.`;
        const suggestion = await generateQuickTip('system', prompt);
        (0, apiResponse_1.ok)(res, 'AI suggestions generated', { suggestions: suggestion });
    }
    catch (error) {
        next(error);
    }
};
exports.getTrainerAISuggestions = getTrainerAISuggestions;
//# sourceMappingURL=trainer.controller.js.map