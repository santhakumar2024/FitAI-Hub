// src/controllers/gym.controller.ts
// Gym management for Gym Owners

import { generateQuickTip } from '../services/ai.service';


import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { ok, created, noContent } from '../utils/apiResponse';
import { PlanType, SubscriptionStatus } from '@prisma/client';
import { addDays } from '../utils/helpers';
import { Role } from '@prisma/client';

// ─────────────────────────────────────────
// POST /gym
// ─────────────────────────────────────────
export const createGym = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { name, address, city, state, pincode, phone, email, logoUrl, description } = req.body;

    const gym = await prisma.$transaction(async (tx) => {
      // 1. Create the Gym
      const newGym = await tx.gym.create({
        data: { name, address, city, state, pincode, phone, email, logoUrl, description, ownerId: userId },
      });

      // 2. Create Platform Subscription for this gym (30-day trial)
      await tx.subscription.create({
        data: {
          userId,
          gymId: newGym.id,
          planType: PlanType.OWNER_500,
          status: SubscriptionStatus.trial,
          trialEndsAt: addDays(new Date(), 30),
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

    created(res, 'Gym created successfully with trial subscription', gym);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /gym
// ─────────────────────────────────────────

export const getMyGyms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const gyms = await prisma.gym.findMany({ 
      where: { ownerId },
      include: { 
        subscription: true,
        membershipPlans: { where: { isActive: true } }
      }
    });
    ok(res, 'Gyms retrieved', gyms);
  } catch (error) {
    next(error);
  }
};

export const getGymDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const { gymId } = req.params;

    const gym = await prisma.gym.findFirst({
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
      notFound(res, 'Gym not found');
      return;
    }

    ok(res, 'Gym details retrieved', gym);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// PATCH /gym
// ─────────────────────────────────────────
export const updateGym = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const { gymId } = req.params;

    const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId } });
    if (!gym) {
      notFound(res, 'Gym not found');
      return;
    }

    const { name, address, city, state, pincode, phone, email, logoUrl, description, isActive } = req.body;

    const updated = await prisma.gym.update({
      where: { id: gymId },
      data: {
        ...(name        !== undefined && { name }),
        ...(address     !== undefined && { address }),
        ...(city        !== undefined && { city }),
        ...(state       !== undefined && { state }),
        ...(pincode     !== undefined && { pincode }),
        ...(phone       !== undefined && { phone }),
        ...(email       !== undefined && { email }),
        ...(logoUrl     !== undefined && { logoUrl }),
        ...(description !== undefined && { description }),
        ...(isActive    !== undefined && { isActive }),
      },
    });

    ok(res, 'Gym updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// POST /gym/trainers (Add trainer to gym)
// ─────────────────────────────────────────
export const addTrainerToGym = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const { gymId } = req.params;
    const { trainerEmail } = req.body;

    const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId } });
    if (!gym) {
      notFound(res, 'Gym not found');
      return;
    }

    const trainer = await prisma.user.findFirst({
      where: { email: trainerEmail, role: Role.TRAINER },
    });

    if (!trainer) {
      notFound(res, 'Trainer not found. They must register with role TRAINER first.');
      return;
    }

    if (trainer.gymId && trainer.gymId !== gym.id) {
      conflict(res, 'Trainer is already associated with another gym');
      return;
    }

    await prisma.user.update({
      where: { id: trainer.id },
      data: { gymId: gym.id },
    });

    // Notify trainer
    await prisma.notification.create({
      data: {
        userId: trainer.id,
        type: 'welcome',
        title: `🏋️ Added to ${gym.name}`,
        body: `You have been added as a trainer at ${gym.name}.`,
      },
    });

    ok(res, 'Trainer added to gym', { trainerId: trainer.id, trainerName: trainer.name });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /gym/trainers
// ─────────────────────────────────────────
export const getGymTrainers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const { gymId } = req.params;

    const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId } });
    if (!gym) {
      notFound(res, 'Gym not found');
      return;
    }

    const trainers = await prisma.user.findMany({
      where: { gymId: gym.id, role: Role.TRAINER },
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

    ok(res, 'Gym trainers retrieved', trainersWithCount);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// DELETE /gym/trainers/:trainerId
// ─────────────────────────────────────────
export const removeTrainerFromGym = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const { gymId, trainerId } = req.params;

    const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId } });
    if (!gym) {
      notFound(res, 'Gym not found');
      return;
    }

    const trainer = await prisma.user.findFirst({
      where: { id: trainerId, gymId: gym.id },
    });

    if (!trainer) {
      notFound(res, 'Trainer not found in your gym');
      return;
    }

    await prisma.user.update({
      where: { id: trainerId },
      data: { gymId: null },
    });

    ok(res, 'Trainer removed from gym');
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /gym/members
// ─────────────────────────────────────────
export const getGymMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const { gymId } = req.params;

    const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId } });
    if (!gym) {
      notFound(res, 'Gym not found');
      return;
    }

    const assignments = await prisma.clientTrainer.findMany({
      where: { gymId: gym.id, isActive: true },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true, bmi: true, weight: true } },
        trainer: { select: { id: true, name: true } },
      },
    });

    ok(res, 'Gym members retrieved', assignments);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// POST /gym/assign-client
// ─────────────────────────────────────────
export const assignClientToTrainer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const { gymId } = req.params;
    const { clientId, trainerId } = req.body;

    const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId } });
    if (!gym) {
      notFound(res, 'Gym not found');
      return;
    }

    // Verify trainer belongs to this gym
    const trainer = await prisma.user.findFirst({
      where: { id: trainerId, gymId: gym.id, role: Role.TRAINER },
    });

    if (!trainer) {
      notFound(res, 'Trainer not found in your gym');
      return;
    }

    // Check if already assigned
    const existing = await prisma.clientTrainer.findFirst({
      where: { clientId, trainerId, isActive: true },
    });

    if (existing) {
      conflict(res, 'Client already assigned to this trainer');
      return;
    }

    const assignment = await prisma.clientTrainer.create({
      data: { clientId, trainerId, gymId: gym.id },
    });

    ok(res, 'Client assigned to trainer', assignment);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// DELETE /clients/:clientId/assign
// ─────────────────────────────────────────
export const unassignClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const { gymId, clientId } = req.params;

    const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId } });
    if (!gym) {
      notFound(res, 'Gym not found');
      return;
    }

    await prisma.clientTrainer.updateMany({
      where: { clientId, gymId: gym.id, isActive: true },
      data: { isActive: false },
    });

    ok(res, 'Client assignment removed');
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /gym/stats
// ─────────────────────────────────────────
export const getGymStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const { gymId } = req.params;

    const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId } });
    if (!gym) {
      notFound(res, 'Gym not found');
      return;
    }

    const [trainerCount, memberCount, activePlans] = await Promise.all([
      prisma.user.count({ where: { gymId: gym.id, role: Role.TRAINER } }),
      prisma.clientTrainer.count({ where: { gymId: gym.id, isActive: true } }),
      prisma.aIPlan.count({
        where: {
          isActive: true,
          user: { clientRelations: { some: { gymId: gym.id, isActive: true } } },
        },
      }),
    ]);

    ok(res, 'Gym stats retrieved', {
      gymName: gym.name,
      trainerCount,
      memberCount,
      activePlans,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// POST /gym/members (Add a member by email)
// ─────────────────────────────────────────
export const addGymMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const { gymId } = req.params;
    const { memberEmail, memberPhone, membershipPlanId } = req.body;

    if (!memberEmail && !memberPhone) {
      res.status(400).json({ success: false, message: 'Provide either memberEmail or memberPhone' });
      return;
    }

    const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId } });
    if (!gym) { notFound(res, 'Gym not found'); return; }

    const member = await prisma.user.findFirst({
      where: {
        OR: [
          ...(memberEmail ? [{ email: memberEmail }] : []),
          ...(memberPhone ? [{ phone: memberPhone }] : []),
        ],
        role: Role.NORMAL_USER,
      },
    });

    if (!member) { notFound(res, 'User not found. Ask them to register on FitAI Hub first.'); return; }

    // Add as client assignment (legacy/core logic)
    const existingAssignment = await prisma.clientTrainer.findFirst({
      where: { clientId: member.id, gymId: gym.id, isActive: true },
    });
    
    if (!existingAssignment) {
      await prisma.clientTrainer.create({
        data: { clientId: member.id, gymId: gym.id, trainerId: ownerId },
      });
    }

    // Handle Membership Plan Assignment if provided
    let membership = null;
    if (membershipPlanId) {
       const plan = await prisma.gymMembershipPlan.findUnique({ where: { id: membershipPlanId } });
       if (plan) {
         const start = new Date();
         const end = new Date();
         end.setMonth(start.getMonth() + plan.durationMonths);
         
         membership = await prisma.gymMembership.create({
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

    await prisma.notification.create({
      data: {
        userId: member.id,
        type: 'welcome',
        title: `🏋️ Welcome to ${gym.name}!`,
        body: `You have been added as a member at ${gym.name}${membership ? ` with a ${membershipPlanId} plan.` : '.'}`,
      },
    });

    created(res, 'Member added to gym successfully', { memberId: member.id, memberName: member.name, membership });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /gym/revenue
// ─────────────────────────────────────────
export const getGymRevenue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const { gymId } = req.params;

    const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId } });
    if (!gym) { notFound(res, 'Gym not found'); return; }

    // Get member count trends across last 6 months
    const now = new Date();
    const months: { month: string; members: number; trainers: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = start.toLocaleString('default', { month: 'short' });

      const [memberCount, trainerCount] = await Promise.all([
        prisma.clientTrainer.count({ where: { gymId: gym.id, assignedAt: { gte: start, lte: end } } }),
        prisma.user.count({ where: { gymId: gym.id, role: Role.TRAINER, createdAt: { gte: start, lte: end } } }),
      ]);

      months.push({ month: monthLabel, members: memberCount, trainers: trainerCount });
    }

    const [totalMembers, totalTrainers, totalActivePlans] = await Promise.all([
      prisma.clientTrainer.count({ where: { gymId: gym.id, isActive: true } }),
      prisma.user.count({ where: { gymId: gym.id, role: Role.TRAINER } }),
      prisma.aIPlan.count({
        where: { isActive: true, user: { clientRelations: { some: { gymId: gym.id, isActive: true } } } },
      }),
    ]);

    // Mock revenue calculation based on member counts (₹2000/member/month base)
    const revenuePerMember = 2000;
    const expensePerTrainer = 15000;
    const estimatedRevenue = totalMembers * revenuePerMember;
    const estimatedExpenditure = totalTrainers * expensePerTrainer;
    const profit = estimatedRevenue - estimatedExpenditure;

    ok(res, 'Revenue data retrieved', {
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
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /gym/ai-suggestions
// ─────────────────────────────────────────
export const getGymAISuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user!.userId;
    const { gymId } = req.params;

    const gym = await prisma.gym.findFirst({ where: { id: gymId, ownerId } });
    if (!gym) { notFound(res, 'Gym not found'); return; }

    const [memberCount, trainerCount] = await Promise.all([
      prisma.clientTrainer.count({ where: { gymId: gym.id, isActive: true } }),
      prisma.user.count({ where: { gymId: gym.id, role: Role.TRAINER } }),
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

    const suggestion = await generateQuickTip('system', prompt);

    ok(res, 'AI suggestions generated', { gymName: gym.name, suggestions: suggestion });
  } catch (error) {
    next(error);
  }
};
