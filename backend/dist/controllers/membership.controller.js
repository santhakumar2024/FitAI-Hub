"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemberMembership = exports.assignMemberPlan = exports.updateGymPlan = exports.getGymPlans = void 0;
const db_1 = require("../config/db");
const apiResponse_1 = require("../utils/apiResponse");
const errorHandler_1 = require("../middleware/errorHandler");
// ─────────────────────────────────────────
// GET /gym/:gymId/plans
// ─────────────────────────────────────────
const getGymPlans = async (req, res, next) => {
    try {
        const { gymId } = req.params;
        const plans = await db_1.prisma.gymMembershipPlan.findMany({
            where: { gymId, isActive: true },
            orderBy: { durationMonths: 'asc' }
        });
        (0, apiResponse_1.ok)(res, 'Membership plans retrieved', plans);
    }
    catch (error) {
        next(error);
    }
};
exports.getGymPlans = getGymPlans;
// ─────────────────────────────────────────
// PATCH /gym/:gymId/plans/:planId
// ─────────────────────────────────────────
const updateGymPlan = async (req, res, next) => {
    try {
        const { planId } = req.params;
        const { name, price, durationMonths, isActive } = req.body;
        const plan = await db_1.prisma.gymMembershipPlan.update({
            where: { id: planId },
            data: { name, price, durationMonths, isActive }
        });
        (0, apiResponse_1.ok)(res, 'Membership plan updated', plan);
    }
    catch (error) {
        next(error);
    }
};
exports.updateGymPlan = updateGymPlan;
// ─────────────────────────────────────────
// POST /gym/:gymId/members/:memberId/membership
// ─────────────────────────────────────────
const assignMemberPlan = async (req, res, next) => {
    try {
        const { gymId, memberId } = req.params;
        const { planId, startDate } = req.body;
        const plan = await db_1.prisma.gymMembershipPlan.findUnique({ where: { id: planId } });
        if (!plan)
            return next(new errorHandler_1.AppError('Plan not found', 404));
        const start = startDate ? new Date(startDate) : new Date();
        const end = new Date(start);
        end.setMonth(start.getMonth() + plan.durationMonths);
        const membership = await db_1.prisma.gymMembership.create({
            data: {
                userId: memberId,
                gymId,
                membershipPlanId: planId,
                startDate: start,
                endDate: end,
                paidAmount: plan.price,
                status: 'active'
            }
        });
        (0, apiResponse_1.created)(res, 'Member assigned to plan successfully', membership);
    }
    catch (error) {
        next(error);
    }
};
exports.assignMemberPlan = assignMemberPlan;
// ─────────────────────────────────────────
// GET /gym/:gymId/members/:memberId/membership
// ─────────────────────────────────────────
const getMemberMembership = async (req, res, next) => {
    try {
        const { memberId, gymId } = req.params;
        const membership = await db_1.prisma.gymMembership.findFirst({
            where: { userId: memberId, gymId },
            include: { plan: true },
            orderBy: { createdAt: 'desc' }
        });
        (0, apiResponse_1.ok)(res, 'Member membership status retrieved', membership);
    }
    catch (error) {
        next(error);
    }
};
exports.getMemberMembership = getMemberMembership;
//# sourceMappingURL=membership.controller.js.map