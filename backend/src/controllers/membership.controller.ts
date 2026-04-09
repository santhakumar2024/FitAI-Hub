// src/controllers/membership.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { ok, created } from '../utils/apiResponse';
import { AppError } from '../middleware/errorHandler';
import { addDays } from '../utils/helpers';

// ─────────────────────────────────────────
// GET /gym/:gymId/plans
// ─────────────────────────────────────────
export const getGymPlans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gymId } = req.params;
    const plans = await prisma.gymMembershipPlan.findMany({
      where: { gymId, isActive: true },
      orderBy: { durationMonths: 'asc' }
    });
    ok(res, 'Membership plans retrieved', plans);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// PATCH /gym/:gymId/plans/:planId
// ─────────────────────────────────────────
export const updateGymPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { planId } = req.params;
    const { name, price, durationMonths, isActive } = req.body;

    const plan = await prisma.gymMembershipPlan.update({
      where: { id: planId },
      data: { name, price, durationMonths, isActive }
    });

    ok(res, 'Membership plan updated', plan);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// POST /gym/:gymId/members/:memberId/membership
// ─────────────────────────────────────────
export const assignMemberPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gymId, memberId } = req.params;
    const { planId, startDate } = req.body;

    const plan = await prisma.gymMembershipPlan.findUnique({ where: { id: planId } });
    if (!plan) return next(new AppError('Plan not found', 404));

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setMonth(start.getMonth() + plan.durationMonths);

    const membership = await prisma.gymMembership.create({
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

    created(res, 'Member assigned to plan successfully', membership);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /gym/:gymId/members/:memberId/membership
// ─────────────────────────────────────────
export const getMemberMembership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { memberId, gymId } = req.params;
    const membership = await prisma.gymMembership.findFirst({
      where: { userId: memberId, gymId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    });
    ok(res, 'Member membership status retrieved', membership);
  } catch (error) {
    next(error);
  }
};
