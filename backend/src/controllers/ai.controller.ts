// src/controllers/ai.controller.ts
// AI Plan generation + manual override endpoints

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { generateAIPlan, estimateCaloriesFromAI, estimateSingleFoodNutrition } from '../services/ai.service';
import { calculateBMI } from '../utils/helpers';
import { ok, created, notFound, forbidden } from '../utils/apiResponse';
import { Role } from '@prisma/client';

// ─────────────────────────────────────────
// POST /ai/generate-plan
// ─────────────────────────────────────────
export const generatePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const input = req.body;

    // Calculate BMI
    const bmi = calculateBMI(input.weight, input.height);

    // Deactivate previous active plans
    await prisma.aIPlan.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Generate plan via AI
    const generatedPlan = await generateAIPlan(userId, input);

    // Count plan versions
    const versionCount = await prisma.aIPlan.count({ where: { userId } });

    // Save the generated plan
    const plan = await prisma.aIPlan.create({
      data: {
        userId,
        version: versionCount + 1,
        durationDays: input.durationDays ?? 7,
        generatedPlan: generatedPlan as any,
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
        estimatedCalories: (generatedPlan as any).estimatedCalories,
        generalNotes: (generatedPlan as any).generalNotes,
      },
    });

    // Update user BMI
    await prisma.user.update({ where: { id: userId }, data: { bmi } });

    // Send notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'plan_generated',
        title: '🏋️ Your AI Plan Is Ready!',
        body: `Your personalized ${input.durationDays || 7}-day fitness plan has been generated. Time to get started!`,
      },
    });

    created(res, 'AI plan generated successfully', {
      planId: plan.id,
      version: plan.version,
      isManuallyEdited: false,
      generatedAt: plan.generatedAt,
      plan: generatedPlan,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /plan/today
// ─────────────────────────────────────────
export const getTodayPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const plan = await prisma.aIPlan.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { editedBy: { select: { name: true, id: true } } },
    });

    if (!plan) {
      notFound(res, 'No active plan found. Generate your AI plan to get started!');
      return;
    }

    ok(res, 'Current plan retrieved', {
      planId: plan.id,
      version: plan.version,
      isManuallyEdited: plan.isManuallyEdited,
      editedBy: plan.editedBy,
      editReason: plan.editReason,
      generatedAt: plan.generatedAt,
      durationDays: plan.durationDays,
      plan: plan.generatedPlan,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /api/v1/plan/date?date=YYYY-MM-DD
// ─────────────────────────────────────────
export const getPlanByDate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const plan = await prisma.aIPlan.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!plan) {
      notFound(res, 'No active plan found');
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
      notFound(res, 'Requested date is before the plan start date');
      return;
    }

    const dayKey = `day${dayNumber}`;
    const dailyPlan = (plan.generatedPlan as any)?.dailyPlan?.[dayKey];

    if (!dailyPlan) {
      notFound(res, 'No plan found for this date');
      return;
    }

    ok(res, `Plan for ${dateStr} (Day ${dayNumber}) retrieved`, {
      planId: plan.id,
      date: dateStr,
      dayNumber,
      recommendation: dailyPlan,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /plan/history
// ─────────────────────────────────────────
export const getPlanHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const whereClause: Record<string, unknown> = { userId };

    if (startDate || endDate) {
      whereClause.generatedAt = {
        ...(startDate && { gte: new Date(startDate as string) }),
        ...(endDate && { lte: new Date(endDate as string) }),
      };
    }

    const [plans, total] = await Promise.all([
      prisma.aIPlan.findMany({
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
      prisma.aIPlan.count({ where: whereClause }),
    ]);

    ok(res, 'Plan history retrieved', plans, {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /plan/:planId
// ─────────────────────────────────────────
export const getPlanById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { planId } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const plan = await prisma.aIPlan.findUnique({
      where: { id: planId },
      include: { editedBy: { select: { name: true, id: true } } },
    });

    if (!plan) {
      notFound(res, 'Plan not found');
      return;
    }

    // Ensure user has access (own plans or trainer/owner)
    const hasAccess =
      plan.userId === userId ||
      userRole === Role.TRAINER ||
      userRole === Role.GYM_OWNER;

    if (!hasAccess) {
      forbidden(res, 'Access denied');
      return;
    }

    ok(res, 'Plan retrieved', {
      planId: plan.id,
      version: plan.version,
      isManuallyEdited: plan.isManuallyEdited,
      editedBy: plan.editedBy,
      editReason: plan.editReason,
      generatedAt: plan.generatedAt,
      plan: plan.generatedPlan,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// PATCH /plan/:planId/override (Trainer only)
// ─────────────────────────────────────────
export const overridePlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { planId } = req.params;
    const trainerId = req.user!.userId;
    const { editedPlan, reason } = req.body;

    const plan = await prisma.aIPlan.findUnique({ where: { id: planId } });

    if (!plan) {
      notFound(res, 'Plan not found');
      return;
    }

    // Verify the trainer has access to this client
    const clientRelation = await prisma.clientTrainer.findFirst({
      where: { clientId: plan.userId, trainerId, isActive: true },
    });

    if (!clientRelation && req.user!.role !== Role.GYM_OWNER) {
      forbidden(res, 'You are not assigned to this client');
      return;
    }

    const updatedPlan = await prisma.aIPlan.update({
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
    await prisma.notification.create({
      data: {
        userId: plan.userId,
        type: 'plan_overridden',
        title: '✏️ Your Trainer Updated Your Plan',
        body: `Your trainer has customized your fitness plan. Reason: ${reason}`,
      },
    });

    ok(res, 'Plan overridden successfully', {
      planId: updatedPlan.id,
      version: updatedPlan.version,
      isManuallyEdited: true,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /plan/client/:clientId/current (Trainer/Owner)
// ─────────────────────────────────────────
export const getClientCurrentPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clientId } = req.params;
    const trainerId = req.user!.userId;
    const userRole = req.user!.role;

    // Verify access
    if (userRole === Role.TRAINER) {
      const relation = await prisma.clientTrainer.findFirst({
        where: { clientId, trainerId, isActive: true },
      });
      if (!relation) {
        forbidden(res, 'Not assigned to this client');
        return;
      }
    }

    const plan = await prisma.aIPlan.findFirst({
      where: { userId: clientId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!plan) {
      notFound(res, 'Client has no active plan');
      return;
    }

    ok(res, 'Client plan retrieved', { planId: plan.id, version: plan.version, plan: plan.generatedPlan });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// POST /ai/estimate-calories
// ─────────────────────────────────────────
export const estimateCalories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { meals } = req.body;

    if (!meals || !Array.isArray(meals) || meals.length === 0) {
      res.status(400).json({ success: false, message: 'Meals array is required' });
      return;
    }

    const estimation = await estimateCaloriesFromAI(meals);

    ok(res, 'Calories estimated successfully', estimation);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// POST /ai/estimate-food
// ─────────────────────────────────────────
export const estimateFoodNutrition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, grams } = req.body;

    if (!name || !grams) {
      res.status(400).json({ success: false, message: 'Food name and grams are required' });
      return;
    }

    const estimation = await estimateSingleFoodNutrition(name, parseFloat(String(grams)));

    ok(res, 'Food nutrition estimated successfully', estimation);
  } catch (error) {
    next(error);
  }
};
