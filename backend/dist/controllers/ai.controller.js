"use strict";
// src/controllers/ai.controller.ts
// AI Plan generation + manual override endpoints
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateFoodNutrition = exports.estimateCalories = exports.getClientCurrentPlan = exports.overridePlan = exports.getPlanById = exports.getPlanHistory = exports.getPlanByDate = exports.getTodayPlan = exports.generatePlan = void 0;
const db_1 = require("../config/db");
const ai_service_1 = require("../services/ai.service");
const helpers_1 = require("../utils/helpers");
const apiResponse_1 = require("../utils/apiResponse");
const client_1 = require("@prisma/client");
// ─────────────────────────────────────────
// POST /ai/generate-plan
// ─────────────────────────────────────────
const generatePlan = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const input = req.body;
        // Calculate BMI
        const bmi = (0, helpers_1.calculateBMI)(input.weight, input.height);
        // Deactivate previous active plans
        await db_1.prisma.aIPlan.updateMany({
            where: { userId, isActive: true },
            data: { isActive: false },
        });
        // Generate plan via AI
        const generatedPlan = await (0, ai_service_1.generateAIPlan)(userId, input);
        // Count plan versions
        const versionCount = await db_1.prisma.aIPlan.count({ where: { userId } });
        // Save the generated plan
        const plan = await db_1.prisma.aIPlan.create({
            data: {
                userId,
                version: versionCount + 1,
                durationDays: input.durationDays ?? 7,
                generatedPlan: generatedPlan,
                isActive: true,
                age: input.age,
                gender: input.gender,
                height: input.height,
                weight: input.weight,
                bmi,
                activityLevel: input.activityLevel,
                medicalConditions: input.medicalConditions ?? [],
                goals: input.goals ?? [],
                preferences: input.preferences ?? [],
                estimatedCalories: generatedPlan.estimatedCalories,
                generalNotes: generatedPlan.generalNotes,
            },
        });
        // Update user BMI
        await db_1.prisma.user.update({ where: { id: userId }, data: { bmi } });
        // Send notification
        await db_1.prisma.notification.create({
            data: {
                userId,
                type: 'plan_generated',
                title: '🏋️ Your AI Plan Is Ready!',
                body: `Your personalized ${input.durationDays || 7}-day fitness plan has been generated. Time to get started!`,
            },
        });
        (0, apiResponse_1.created)(res, 'AI plan generated successfully', {
            planId: plan.id,
            version: plan.version,
            isManuallyEdited: false,
            generatedAt: plan.generatedAt,
            plan: generatedPlan,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.generatePlan = generatePlan;
// ─────────────────────────────────────────
// GET /plan/today
// ─────────────────────────────────────────
const getTodayPlan = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const plan = await db_1.prisma.aIPlan.findFirst({
            where: { userId, isActive: true },
            orderBy: { createdAt: 'desc' },
            include: { editedBy: { select: { name: true, id: true } } },
        });
        if (!plan) {
            (0, apiResponse_1.notFound)(res, 'No active plan found. Generate your AI plan to get started!');
            return;
        }
        (0, apiResponse_1.ok)(res, 'Current plan retrieved', {
            planId: plan.id,
            version: plan.version,
            isManuallyEdited: plan.isManuallyEdited,
            editedBy: plan.editedBy,
            editReason: plan.editReason,
            generatedAt: plan.generatedAt,
            durationDays: plan.durationDays,
            plan: plan.generatedPlan,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTodayPlan = getTodayPlan;
// ─────────────────────────────────────────
// GET /api/v1/plan/date?date=YYYY-MM-DD
// ─────────────────────────────────────────
const getPlanByDate = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const dateStr = req.query.date || new Date().toISOString().split('T')[0];
        const targetDate = new Date(dateStr);
        targetDate.setHours(0, 0, 0, 0);
        const plan = await db_1.prisma.aIPlan.findFirst({
            where: { userId, isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        if (!plan) {
            (0, apiResponse_1.notFound)(res, 'No active plan found');
            return;
        }
        const startDate = new Date(plan.generatedAt);
        startDate.setHours(0, 0, 0, 0);
        // Calculate day number (1-indexed)
        const diffTime = targetDate.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        // Cycle the plan if it exceeds duration (e.g., day 8 of a 7-day plan loops to day 1)
        const dayNumber = (diffDays % plan.durationDays) + 1;
        if (dayNumber < 1) {
            (0, apiResponse_1.notFound)(res, 'Requested date is before the plan start date');
            return;
        }
        const dayKey = `day${dayNumber}`;
        const dailyPlan = plan.generatedPlan?.dailyPlan?.[dayKey];
        if (!dailyPlan) {
            (0, apiResponse_1.notFound)(res, 'No plan found for this date');
            return;
        }
        (0, apiResponse_1.ok)(res, `Plan for ${dateStr} (Day ${dayNumber}) retrieved`, {
            planId: plan.id,
            date: dateStr,
            dayNumber,
            recommendation: dailyPlan,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPlanByDate = getPlanByDate;
// ─────────────────────────────────────────
// GET /plan/history
// ─────────────────────────────────────────
const getPlanHistory = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { page = 1, limit = 10, startDate, endDate } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const whereClause = { userId };
        if (startDate || endDate) {
            whereClause.generatedAt = {
                ...(startDate && { gte: new Date(startDate) }),
                ...(endDate && { lte: new Date(endDate) }),
            };
        }
        const [plans, total] = await Promise.all([
            db_1.prisma.aIPlan.findMany({
                where: whereClause,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, version: true, isManuallyEdited: true, isActive: true,
                    generatedAt: true, durationDays: true, estimatedCalories: true, generalNotes: true,
                    editedBy: { select: { name: true } },
                },
            }),
            db_1.prisma.aIPlan.count({ where: whereClause }),
        ]);
        (0, apiResponse_1.ok)(res, 'Plan history retrieved', plans, {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / Number(limit)),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPlanHistory = getPlanHistory;
// ─────────────────────────────────────────
// GET /plan/:planId
// ─────────────────────────────────────────
const getPlanById = async (req, res, next) => {
    try {
        const { planId } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;
        const plan = await db_1.prisma.aIPlan.findUnique({
            where: { id: planId },
            include: { editedBy: { select: { name: true, id: true } } },
        });
        if (!plan) {
            (0, apiResponse_1.notFound)(res, 'Plan not found');
            return;
        }
        // Ensure user has access (own plans or trainer/owner)
        const hasAccess = plan.userId === userId ||
            userRole === client_1.Role.TRAINER ||
            userRole === client_1.Role.GYM_OWNER;
        if (!hasAccess) {
            (0, apiResponse_1.forbidden)(res, 'Access denied');
            return;
        }
        (0, apiResponse_1.ok)(res, 'Plan retrieved', {
            planId: plan.id,
            version: plan.version,
            isManuallyEdited: plan.isManuallyEdited,
            editedBy: plan.editedBy,
            editReason: plan.editReason,
            generatedAt: plan.generatedAt,
            plan: plan.generatedPlan,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPlanById = getPlanById;
// ─────────────────────────────────────────
// PATCH /plan/:planId/override (Trainer only)
// ─────────────────────────────────────────
const overridePlan = async (req, res, next) => {
    try {
        const { planId } = req.params;
        const trainerId = req.user.userId;
        const { editedPlan, reason } = req.body;
        const plan = await db_1.prisma.aIPlan.findUnique({ where: { id: planId } });
        if (!plan) {
            (0, apiResponse_1.notFound)(res, 'Plan not found');
            return;
        }
        // Verify the trainer has access to this client
        const clientRelation = await db_1.prisma.clientTrainer.findFirst({
            where: { clientId: plan.userId, trainerId, isActive: true },
        });
        if (!clientRelation && req.user.role !== client_1.Role.GYM_OWNER) {
            (0, apiResponse_1.forbidden)(res, 'You are not assigned to this client');
            return;
        }
        const updatedPlan = await db_1.prisma.aIPlan.update({
            where: { id: planId },
            data: {
                generatedPlan: editedPlan,
                isManuallyEdited: true,
                editedById: trainerId,
                editedAt: new Date(),
                editReason: reason,
                version: { increment: 1 },
            },
        });
        // Notify client
        await db_1.prisma.notification.create({
            data: {
                userId: plan.userId,
                type: 'plan_overridden',
                title: '✏️ Your Trainer Updated Your Plan',
                body: `Your trainer has customized your fitness plan. Reason: ${reason}`,
            },
        });
        (0, apiResponse_1.ok)(res, 'Plan overridden successfully', {
            planId: updatedPlan.id,
            version: updatedPlan.version,
            isManuallyEdited: true,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.overridePlan = overridePlan;
// ─────────────────────────────────────────
// GET /plan/client/:clientId/current (Trainer/Owner)
// ─────────────────────────────────────────
const getClientCurrentPlan = async (req, res, next) => {
    try {
        const { clientId } = req.params;
        const trainerId = req.user.userId;
        const userRole = req.user.role;
        // Verify access
        if (userRole === client_1.Role.TRAINER) {
            const relation = await db_1.prisma.clientTrainer.findFirst({
                where: { clientId, trainerId, isActive: true },
            });
            if (!relation) {
                (0, apiResponse_1.forbidden)(res, 'Not assigned to this client');
                return;
            }
        }
        const plan = await db_1.prisma.aIPlan.findFirst({
            where: { userId: clientId, isActive: true },
            orderBy: { createdAt: 'desc' },
        });
        if (!plan) {
            (0, apiResponse_1.notFound)(res, 'Client has no active plan');
            return;
        }
        (0, apiResponse_1.ok)(res, 'Client plan retrieved', { planId: plan.id, version: plan.version, plan: plan.generatedPlan });
    }
    catch (error) {
        next(error);
    }
};
exports.getClientCurrentPlan = getClientCurrentPlan;
// ─────────────────────────────────────────
// POST /ai/estimate-calories
// ─────────────────────────────────────────
const estimateCalories = async (req, res, next) => {
    try {
        const { meals } = req.body;
        if (!meals || !Array.isArray(meals) || meals.length === 0) {
            res.status(400).json({ success: false, message: 'Meals array is required' });
            return;
        }
        const estimation = await (0, ai_service_1.estimateCaloriesFromAI)(meals);
        (0, apiResponse_1.ok)(res, 'Calories estimated successfully', estimation);
    }
    catch (error) {
        next(error);
    }
};
exports.estimateCalories = estimateCalories;
// ─────────────────────────────────────────
// POST /ai/estimate-food
// ─────────────────────────────────────────
const estimateFoodNutrition = async (req, res, next) => {
    try {
        const { name, grams } = req.body;
        if (!name || !grams) {
            res.status(400).json({ success: false, message: 'Food name and grams are required' });
            return;
        }
        const estimation = await (0, ai_service_1.estimateSingleFoodNutrition)(name, parseFloat(String(grams)));
        (0, apiResponse_1.ok)(res, 'Food nutrition estimated successfully', estimation);
    }
    catch (error) {
        next(error);
    }
};
exports.estimateFoodNutrition = estimateFoodNutrition;
//# sourceMappingURL=ai.controller.js.map