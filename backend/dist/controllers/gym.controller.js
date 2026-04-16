"use strict";
// src/controllers/gym.controller.ts
// Gym management for Gym Owners
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGymAISuggestions = exports.getGymRevenue = exports.addGymMember = exports.getGymStats = exports.unassignClient = exports.assignClientToTrainer = exports.getGymMembers = exports.removeTrainerFromGym = exports.getGymTrainers = exports.addTrainerToGym = exports.updateGym = exports.getGymDetails = exports.getMyGyms = exports.createGym = void 0;
const ai_service_1 = require("../services/ai.service");
const db_1 = require("../config/db");
const apiResponse_1 = require("../utils/apiResponse");
const client_1 = require("@prisma/client");
const helpers_1 = require("../utils/helpers");
const client_2 = require("@prisma/client");
// ─────────────────────────────────────────
// POST /gym
// ─────────────────────────────────────────
const createGym = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { name, address, city, state, pincode, phone, email, logoUrl, description } = req.body;
        const gym = await db_1.prisma.$transaction(async (tx) => {
            // 1. Create the Gym
            const newGym = await tx.gym.create({
                data: { name, address, city, state, pincode, phone, email, logoUrl, description, ownerId: userId },
            });
            // 2. Create Platform Subscription for this gym (30-day trial)
            await tx.subscription.create({
                data: {
                    userId,
                    gymId: newGym.id,
                    planType: client_1.PlanType.OWNER_500,
                    status: client_1.SubscriptionStatus.trial,
                    trialEndsAt: (0, helpers_1.addDays)(new Date(), 30),
                },
            });
            // 3. Create Default Membership Plans for Trainees
            const defaultPlans = [
                { name: 'Monthly', durationMonths: 1, price: 1000 },
                { name: '3 Months', durationMonths: 3, price: 2500 },
                { name: '6 Months', durationMonths: 6, price: 4500 },
                { name: 'Yearly', durationMonths: 12, price: 8000 },
            ];
            await tx.gymMembershipPlan.createMany({
                data: defaultPlans.map(p => ({ ...p, gymId: newGym.id })),
            });
            return newGym;
        });
        (0, apiResponse_1.created)(res, 'Gym created successfully with trial subscription', gym);
    }
    catch (error) {
        next(error);
    }
};
exports.createGym = createGym;
// ─────────────────────────────────────────
// GET /gym
// ─────────────────────────────────────────
const getMyGyms = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const gyms = await db_1.prisma.gym.findMany({
            where: { ownerId },
            include: {
                subscription: true,
                membershipPlans: { where: { isActive: true } }
            }
        });
        (0, apiResponse_1.ok)(res, 'Gyms retrieved', gyms);
    }
    catch (error) {
        next(error);
    }
};
exports.getMyGyms = getMyGyms;
const getGymDetails = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const { gymId } = req.params;
        const gym = await db_1.prisma.gym.findFirst({
            where: { id: gymId, ownerId },
            include: {
                subscription: true,
                membershipPlans: { where: { isActive: true } },
                trainers: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } },
                clientAssignments: {
                    where: { isActive: true },
                    include: { client: { select: { id: true, name: true } } },
                },
            },
        });
        if (!gym) {
            (0, apiResponse_1.notFound)(res, 'Gym not found');
            return;
        }
        (0, apiResponse_1.ok)(res, 'Gym details retrieved', gym);
    }
    catch (error) {
        next(error);
    }
};
exports.getGymDetails = getGymDetails;
// ─────────────────────────────────────────
// PATCH /gym
// ─────────────────────────────────────────
const updateGym = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const { gymId } = req.params;
        const gym = await db_1.prisma.gym.findFirst({ where: { id: gymId, ownerId } });
        if (!gym) {
            (0, apiResponse_1.notFound)(res, 'Gym not found');
            return;
        }
        const { name, address, city, state, pincode, phone, email, logoUrl, description, isActive } = req.body;
        const updated = await db_1.prisma.gym.update({
            where: { id: gymId },
            data: {
                ...(name !== undefined && { name }),
                ...(address !== undefined && { address }),
                ...(city !== undefined && { city }),
                ...(state !== undefined && { state }),
                ...(pincode !== undefined && { pincode }),
                ...(phone !== undefined && { phone }),
                ...(email !== undefined && { email }),
                ...(logoUrl !== undefined && { logoUrl }),
                ...(description !== undefined && { description }),
                ...(isActive !== undefined && { isActive }),
            },
        });
        (0, apiResponse_1.ok)(res, 'Gym updated successfully', updated);
    }
    catch (error) {
        next(error);
    }
};
exports.updateGym = updateGym;
// ─────────────────────────────────────────
// POST /gym/trainers (Add trainer to gym)
// ─────────────────────────────────────────
const addTrainerToGym = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const { gymId } = req.params;
        const { trainerEmail } = req.body;
        const gym = await db_1.prisma.gym.findFirst({ where: { id: gymId, ownerId } });
        if (!gym) {
            (0, apiResponse_1.notFound)(res, 'Gym not found');
            return;
        }
        const trainer = await db_1.prisma.user.findFirst({
            where: { email: trainerEmail, role: client_2.Role.TRAINER },
        });
        if (!trainer) {
            (0, apiResponse_1.notFound)(res, 'Trainer not found. They must register with role TRAINER first.');
            return;
        }
        if (trainer.gymId && trainer.gymId !== gym.id) {
            (0, apiResponse_1.conflict)(res, 'Trainer is already associated with another gym');
            return;
        }
        await db_1.prisma.user.update({
            where: { id: trainer.id },
            data: { gymId: gym.id },
        });
        // Notify trainer
        await db_1.prisma.notification.create({
            data: {
                userId: trainer.id,
                type: 'welcome',
                title: `🏋️ Added to ${gym.name}`,
                body: `You have been added as a trainer at ${gym.name}.`,
            },
        });
        (0, apiResponse_1.ok)(res, 'Trainer added to gym', { trainerId: trainer.id, trainerName: trainer.name });
    }
    catch (error) {
        next(error);
    }
};
exports.addTrainerToGym = addTrainerToGym;
// ─────────────────────────────────────────
// GET /gym/trainers
// ─────────────────────────────────────────
const getGymTrainers = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const { gymId } = req.params;
        const gym = await db_1.prisma.gym.findFirst({ where: { id: gymId, ownerId } });
        if (!gym) {
            (0, apiResponse_1.notFound)(res, 'Gym not found');
            return;
        }
        const trainers = await db_1.prisma.user.findMany({
            where: { gymId: gym.id, role: client_2.Role.TRAINER },
            select: {
                id: true, name: true, email: true, phone: true, photoUrl: true,
                trainerClients: { where: { isActive: true }, select: { clientId: true } },
            },
        });
        const trainersWithCount = trainers.map((t) => ({
            ...t,
            clientCount: t.trainerClients.length,
            trainerClients: undefined,
        }));
        (0, apiResponse_1.ok)(res, 'Gym trainers retrieved', trainersWithCount);
    }
    catch (error) {
        next(error);
    }
};
exports.getGymTrainers = getGymTrainers;
// ─────────────────────────────────────────
// DELETE /gym/trainers/:trainerId
// ─────────────────────────────────────────
const removeTrainerFromGym = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const { gymId, trainerId } = req.params;
        const gym = await db_1.prisma.gym.findFirst({ where: { id: gymId, ownerId } });
        if (!gym) {
            (0, apiResponse_1.notFound)(res, 'Gym not found');
            return;
        }
        const trainer = await db_1.prisma.user.findFirst({
            where: { id: trainerId, gymId: gym.id },
        });
        if (!trainer) {
            (0, apiResponse_1.notFound)(res, 'Trainer not found in your gym');
            return;
        }
        await db_1.prisma.user.update({
            where: { id: trainerId },
            data: { gymId: null },
        });
        (0, apiResponse_1.ok)(res, 'Trainer removed from gym');
    }
    catch (error) {
        next(error);
    }
};
exports.removeTrainerFromGym = removeTrainerFromGym;
// ─────────────────────────────────────────
// GET /gym/members
// ─────────────────────────────────────────
const getGymMembers = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const { gymId } = req.params;
        const gym = await db_1.prisma.gym.findFirst({ where: { id: gymId, ownerId } });
        if (!gym) {
            (0, apiResponse_1.notFound)(res, 'Gym not found');
            return;
        }
        const assignments = await db_1.prisma.clientTrainer.findMany({
            where: { gymId: gym.id, isActive: true },
            include: {
                client: { select: { id: true, name: true, email: true, phone: true, bmi: true, weight: true } },
                trainer: { select: { id: true, name: true } },
            },
        });
        (0, apiResponse_1.ok)(res, 'Gym members retrieved', assignments);
    }
    catch (error) {
        next(error);
    }
};
exports.getGymMembers = getGymMembers;
// ─────────────────────────────────────────
// POST /gym/assign-client
// ─────────────────────────────────────────
const assignClientToTrainer = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const { gymId } = req.params;
        const { clientId, trainerId } = req.body;
        const gym = await db_1.prisma.gym.findFirst({ where: { id: gymId, ownerId } });
        if (!gym) {
            (0, apiResponse_1.notFound)(res, 'Gym not found');
            return;
        }
        // Verify trainer belongs to this gym
        const trainer = await db_1.prisma.user.findFirst({
            where: { id: trainerId, gymId: gym.id, role: client_2.Role.TRAINER },
        });
        if (!trainer) {
            (0, apiResponse_1.notFound)(res, 'Trainer not found in your gym');
            return;
        }
        // Check if already assigned
        const existing = await db_1.prisma.clientTrainer.findFirst({
            where: { clientId, trainerId, isActive: true },
        });
        if (existing) {
            (0, apiResponse_1.conflict)(res, 'Client already assigned to this trainer');
            return;
        }
        const assignment = await db_1.prisma.clientTrainer.create({
            data: { clientId, trainerId, gymId: gym.id },
        });
        (0, apiResponse_1.ok)(res, 'Client assigned to trainer', assignment);
    }
    catch (error) {
        next(error);
    }
};
exports.assignClientToTrainer = assignClientToTrainer;
// ─────────────────────────────────────────
// DELETE /clients/:clientId/assign
// ─────────────────────────────────────────
const unassignClient = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const { gymId, clientId } = req.params;
        const gym = await db_1.prisma.gym.findFirst({ where: { id: gymId, ownerId } });
        if (!gym) {
            (0, apiResponse_1.notFound)(res, 'Gym not found');
            return;
        }
        await db_1.prisma.clientTrainer.updateMany({
            where: { clientId, gymId: gym.id, isActive: true },
            data: { isActive: false },
        });
        (0, apiResponse_1.ok)(res, 'Client assignment removed');
    }
    catch (error) {
        next(error);
    }
};
exports.unassignClient = unassignClient;
// ─────────────────────────────────────────
// GET /gym/stats
// ─────────────────────────────────────────
const getGymStats = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const { gymId } = req.params;
        const gym = await db_1.prisma.gym.findFirst({ where: { id: gymId, ownerId } });
        if (!gym) {
            (0, apiResponse_1.notFound)(res, 'Gym not found');
            return;
        }
        const [trainerCount, memberCount, activePlans] = await Promise.all([
            db_1.prisma.user.count({ where: { gymId: gym.id, role: client_2.Role.TRAINER } }),
            db_1.prisma.clientTrainer.count({ where: { gymId: gym.id, isActive: true } }),
            db_1.prisma.aIPlan.count({
                where: {
                    isActive: true,
                    user: { clientRelations: { some: { gymId: gym.id, isActive: true } } },
                },
            }),
        ]);
        (0, apiResponse_1.ok)(res, 'Gym stats retrieved', {
            gymName: gym.name,
            trainerCount,
            memberCount,
            activePlans,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getGymStats = getGymStats;
// ─────────────────────────────────────────
// POST /gym/members (Add a member by email)
// ─────────────────────────────────────────
const addGymMember = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const { gymId } = req.params;
        const { memberEmail, memberPhone, membershipPlanId } = req.body;
        if (!memberEmail && !memberPhone) {
            res.status(400).json({ success: false, message: 'Provide either memberEmail or memberPhone' });
            return;
        }
        const gym = await db_1.prisma.gym.findFirst({ where: { id: gymId, ownerId } });
        if (!gym) {
            (0, apiResponse_1.notFound)(res, 'Gym not found');
            return;
        }
        const member = await db_1.prisma.user.findFirst({
            where: {
                OR: [
                    ...(memberEmail ? [{ email: memberEmail }] : []),
                    ...(memberPhone ? [{ phone: memberPhone }] : []),
                ],
                role: client_2.Role.NORMAL_USER,
            },
        });
        if (!member) {
            (0, apiResponse_1.notFound)(res, 'User not found. Ask them to register on FitAI Hub first.');
            return;
        }
        // Add as client assignment (legacy/core logic)
        const existingAssignment = await db_1.prisma.clientTrainer.findFirst({
            where: { clientId: member.id, gymId: gym.id, isActive: true },
        });
        if (!existingAssignment) {
            await db_1.prisma.clientTrainer.create({
                data: { clientId: member.id, gymId: gym.id, trainerId: ownerId },
            });
        }
        // Handle Membership Plan Assignment if provided
        let membership = null;
        if (membershipPlanId) {
            const plan = await db_1.prisma.gymMembershipPlan.findUnique({ where: { id: membershipPlanId } });
            if (plan) {
                const start = new Date();
                const end = new Date();
                end.setMonth(start.getMonth() + plan.durationMonths);
                membership = await db_1.prisma.gymMembership.create({
                    data: {
                        userId: member.id,
                        gymId: gym.id,
                        membershipPlanId,
                        startDate: start,
                        endDate: end,
                        paidAmount: plan.price,
                        status: 'active'
                    }
                });
            }
        }
        await db_1.prisma.notification.create({
            data: {
                userId: member.id,
                type: 'welcome',
                title: `🏋️ Welcome to ${gym.name}!`,
                body: `You have been added as a member at ${gym.name}${membership ? ` with a ${membershipPlanId} plan.` : '.'}`,
            },
        });
        (0, apiResponse_1.created)(res, 'Member added to gym successfully', { memberId: member.id, memberName: member.name, membership });
    }
    catch (error) {
        next(error);
    }
};
exports.addGymMember = addGymMember;
// ─────────────────────────────────────────
// GET /gym/revenue
// ─────────────────────────────────────────
const getGymRevenue = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const { gymId } = req.params;
        const gym = await db_1.prisma.gym.findFirst({ where: { id: gymId, ownerId } });
        if (!gym) {
            (0, apiResponse_1.notFound)(res, 'Gym not found');
            return;
        }
        // Get member count trends across last 6 months
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const monthLabel = start.toLocaleString('default', { month: 'short' });
            const [memberCount, trainerCount] = await Promise.all([
                db_1.prisma.clientTrainer.count({ where: { gymId: gym.id, assignedAt: { gte: start, lte: end } } }),
                db_1.prisma.user.count({ where: { gymId: gym.id, role: client_2.Role.TRAINER, createdAt: { gte: start, lte: end } } }),
            ]);
            months.push({ month: monthLabel, members: memberCount, trainers: trainerCount });
        }
        const [totalMembers, totalTrainers, totalActivePlans] = await Promise.all([
            db_1.prisma.clientTrainer.count({ where: { gymId: gym.id, isActive: true } }),
            db_1.prisma.user.count({ where: { gymId: gym.id, role: client_2.Role.TRAINER } }),
            db_1.prisma.aIPlan.count({
                where: { isActive: true, user: { clientRelations: { some: { gymId: gym.id, isActive: true } } } },
            }),
        ]);
        // Mock revenue calculation based on member counts (₹2000/member/month base)
        const revenuePerMember = 2000;
        const expensePerTrainer = 15000;
        const estimatedRevenue = totalMembers * revenuePerMember;
        const estimatedExpenditure = totalTrainers * expensePerTrainer;
        const profit = estimatedRevenue - estimatedExpenditure;
        (0, apiResponse_1.ok)(res, 'Revenue data retrieved', {
            gymName: gym.name,
            totalMembers,
            totalTrainers,
            totalActivePlans,
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
exports.getGymRevenue = getGymRevenue;
// ─────────────────────────────────────────
// GET /gym/ai-suggestions
// ─────────────────────────────────────────
const getGymAISuggestions = async (req, res, next) => {
    try {
        const ownerId = req.user.userId;
        const { gymId } = req.params;
        const gym = await db_1.prisma.gym.findFirst({ where: { id: gymId, ownerId } });
        if (!gym) {
            (0, apiResponse_1.notFound)(res, 'Gym not found');
            return;
        }
        const [memberCount, trainerCount] = await Promise.all([
            db_1.prisma.clientTrainer.count({ where: { gymId: gym.id, isActive: true } }),
            db_1.prisma.user.count({ where: { gymId: gym.id, role: client_2.Role.TRAINER } }),
        ]);
        const avgClientsPerTrainer = trainerCount > 0 ? Math.round(memberCount / trainerCount) : 0;
        const revenueEstimate = memberCount * 2000;
        const expenseEstimate = trainerCount * 15000;
        const profit = revenueEstimate - expenseEstimate;
        const prompt = `You are a gym business consultant AI. Analyze this gym data and provide 3-4 specific, actionable business suggestions in a helpful tone.

Gym: ${gym.name}
Total Members: ${memberCount}
Total Trainers: ${trainerCount}
Avg Clients per Trainer: ${avgClientsPerTrainer}
Estimated Monthly Revenue: ₹${revenueEstimate}
Estimated Monthly Expenses: ₹${expenseEstimate}
Profit/Loss: ₹${profit} (${profit >= 0 ? 'PROFIT' : 'LOSS'})

Provide insights about: member retention, trainer efficiency, revenue growth, and cost optimization. Keep each point concise (1-2 sentences). Format as a numbered list.`;
        const suggestion = await (0, ai_service_1.generateQuickTip)('system', prompt);
        (0, apiResponse_1.ok)(res, 'AI suggestions generated', { gymName: gym.name, suggestions: suggestion });
    }
    catch (error) {
        next(error);
    }
};
exports.getGymAISuggestions = getGymAISuggestions;
//# sourceMappingURL=gym.controller.js.map