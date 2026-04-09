// src/controllers/trainer.controller.ts
// Trainer and client management endpoints

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { ok, created, notFound, forbidden, conflict } from '../utils/apiResponse';
import { buildPaginationMeta } from '../utils/helpers';
import { Role } from '@prisma/client';

// ─────────────────────────────────────────
// GET /clients (Trainer: list my clients)
// ─────────────────────────────────────────
export const getMyClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trainerId = req.user!.userId;
    const { search, page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: Record<string, unknown> = { trainerId, isActive: true };
    if (search) {
      whereClause.client = {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const [relations, total] = await Promise.all([
      prisma.clientTrainer.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        include: {
          client: {
            select: {
              id: true, name: true, email: true, phone: true, age: true, gender: true,
              bmi: true, weight: true, height: true, goals: true, photoUrl: true,
              subscription: { select: { status: true, planType: true } },
            },
          },
        },
      }),
      prisma.clientTrainer.count({ where: whereClause }),
    ]);

    const clients = relations.map((r) => ({ ...r.client, assignedAt: r.assignedAt }));

    ok(res, 'Clients retrieved', clients, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /clients/:clientId (Client details)
// ─────────────────────────────────────────
export const getClientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trainerId = req.user!.userId;
    const { clientId } = req.params;

    // Verify trainer has access to this client
    const relation = await prisma.clientTrainer.findFirst({
      where: { clientId, trainerId, isActive: true },
    });

    if (!relation && req.user!.role !== Role.GYM_OWNER) {
      forbidden(res, 'Not assigned to this client');
      return;
    }

    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true, name: true, email: true, phone: true, age: true, gender: true,
        height: true, weight: true, bmi: true, goals: true, medicalConditions: true,
        activityLevel: true, photoUrl: true, createdAt: true,
        subscription: { select: { status: true, planType: true, trialEndsAt: true } },
        aiPlans: {
          where: { isActive: true },
          select: { id: true, version: true, isManuallyEdited: true, generatedAt: true },
          take: 1,
        },
      },
    });

    if (!client) {
      notFound(res, 'Client not found');
      return;
    }

    ok(res, 'Client details retrieved', client);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /clients/:clientId/progress
// ─────────────────────────────────────────
export const getClientProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trainerId = req.user!.userId;
    const { clientId } = req.params;

    const relation = await prisma.clientTrainer.findFirst({
      where: { clientId, trainerId, isActive: true },
    });

    if (!relation && req.user!.role !== Role.GYM_OWNER) {
      forbidden(res, 'Not assigned to this client');
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.progressLog.findMany({
      where: { userId: clientId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'desc' },
      include: { dietLog: true, workoutLogs: true, yogaLogs: true },
    });

    const notes = await prisma.trainerNote.findMany({
      where: { clientId, trainerId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    ok(res, 'Client progress retrieved', { logs, notes, totalLogs: logs.length });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /clients/:clientId/plans
// ─────────────────────────────────────────
export const getClientPlans = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { clientId } = req.params;
    const trainerId = req.user!.userId;

    const relation = await prisma.clientTrainer.findFirst({
      where: { clientId, trainerId, isActive: true },
    });

    if (!relation && req.user!.role !== Role.GYM_OWNER) {
      forbidden(res, 'Not assigned to this client');
      return;
    }

    const plans = await prisma.aIPlan.findMany({
      where: { userId: clientId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, version: true, isManuallyEdited: true, isActive: true,
        generatedAt: true, editReason: true, durationDays: true,
        editedBy: { select: { name: true } },
      },
    });

    ok(res, 'Client plans retrieved', plans);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// POST /freelancer/clients (Freelance trainer adds client by email/phone)
// ─────────────────────────────────────────
export const addFreelanceClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trainerId = req.user!.userId;
    const { clientEmail, clientPhone } = req.body;

    if (!clientEmail && !clientPhone) {
      forbidden(res, 'Provide either clientEmail or clientPhone');
      return;
    }

    const client = await prisma.user.findFirst({
      where: {
        OR: [
          ...(clientEmail ? [{ email: clientEmail }] : []),
          ...(clientPhone ? [{ phone: clientPhone }] : []),
        ],
        role: Role.NORMAL_USER,
      },
    });

    if (!client) {
      notFound(res, 'User not found. Ask them to register on FitAI Hub first.');
      return;
    }

    // Check if already assigned
    const existing = await prisma.clientTrainer.findFirst({
      where: { clientId: client.id, trainerId, isActive: true },
    });

    if (existing) {
      conflict(res, 'Client already in your list');
      return;
    }

    const relation = await prisma.clientTrainer.create({
      data: { clientId: client.id, trainerId },
    });

    // Notify client
    const trainer = await prisma.user.findUnique({ where: { id: trainerId }, select: { name: true } });
    await prisma.notification.create({
      data: {
        userId: client.id,
        type: 'trainer_note',
        title: '🏋️ New Trainer Assigned!',
        body: `${trainer?.name} has added you as a client on FitAI Hub.`,
      },
    });

    created(res, 'Client added successfully', { clientId: client.id, clientName: client.name });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// POST /trainer/note
// ─────────────────────────────────────────
export const addTrainerNote = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trainerId = req.user!.userId;
    const { clientId, note } = req.body;

    const relation = await prisma.clientTrainer.findFirst({
      where: { clientId, trainerId, isActive: true },
    });

    if (!relation) {
      forbidden(res, 'Not assigned to this client');
      return;
    }

    const trainerNote = await prisma.trainerNote.create({
      data: { trainerId, clientId, note },
    });

    // Notify client
    await prisma.notification.create({
      data: {
        userId: clientId,
        type: 'trainer_note',
        title: '📝 New Note From Your Trainer',
        body: note.length > 80 ? `${note.substring(0, 80)}...` : note,
      },
    });

    created(res, 'Note added', trainerNote);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /trainer/clients/:clientId/logs (Client log history for calendar)
// ─────────────────────────────────────────
export const getClientLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trainerId = req.user!.userId;
    const { clientId } = req.params;
    const { limit = 60 } = req.query;

    const relation = await prisma.clientTrainer.findFirst({
      where: { clientId, trainerId, isActive: true },
    });
    if (!relation && req.user!.role !== Role.GYM_OWNER) { forbidden(res, 'Not assigned to this client'); return; }

    const logs = await prisma.progressLog.findMany({
      where: { userId: clientId },
      orderBy: { date: 'desc' },
      take: Number(limit),
      select: { id: true, date: true, notes: true },
    });

    ok(res, 'Client logs retrieved', logs);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /trainer/clients/:clientId/logs/daily (Single-day detail)
// ─────────────────────────────────────────
export const getClientDailyLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trainerId = req.user!.userId;
    const { clientId } = req.params;
    const { date } = req.query;

    const relation = await prisma.clientTrainer.findFirst({
      where: { clientId, trainerId, isActive: true },
    });
    if (!relation && req.user!.role !== Role.GYM_OWNER) { forbidden(res, 'Not assigned to this client'); return; }

    const targetDate = date ? new Date(date as string) : new Date();
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayEnd = new Date(dayStart.getTime() + 86400000 - 1);

    const log = await prisma.progressLog.findFirst({
      where: { userId: clientId, date: { gte: dayStart, lte: dayEnd } },
      include: { dietLog: true, workoutLogs: true, yogaLogs: true },
    });

    ok(res, 'Client daily log retrieved', log);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /trainer/revenue (Freelance trainer revenue stats)
// ─────────────────────────────────────────
export const getTrainerRevenue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trainerId = req.user!.userId;

    const trainer = await prisma.user.findUnique({
      where: { id: trainerId },
      select: { name: true, gymId: true },
    });
    if (!trainer) { notFound(res, 'Trainer not found'); return; }

    const [totalClients, activeClients] = await Promise.all([
      prisma.clientTrainer.count({ where: { trainerId } }),
      prisma.clientTrainer.count({ where: { trainerId, isActive: true } }),
    ]);

    const now = new Date();
    const months: { month: string; clients: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const count = await prisma.clientTrainer.count({
        where: { trainerId, assignedAt: { gte: start, lte: end } },
      });
      months.push({ month: start.toLocaleString('default', { month: 'short' }), clients: count });
    }

    const sessionFeePerClient = 3000;
    const estimatedRevenue = activeClients * sessionFeePerClient;
    const estimatedExpenditure = 2000;
    const profit = estimatedRevenue - estimatedExpenditure;

    ok(res, 'Trainer revenue retrieved', {
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
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /trainer/ai-suggestions (Freelance trainer AI suggestions)
// ─────────────────────────────────────────
export const getTrainerAISuggestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trainerId = req.user!.userId;
    const { generateQuickTip } = await import('../services/ai.service');

    const [totalClients, activeClients] = await Promise.all([
      prisma.clientTrainer.count({ where: { trainerId } }),
      prisma.clientTrainer.count({ where: { trainerId, isActive: true } }),
    ]);

    const revenueEstimate = activeClients * 3000;
    const profit = revenueEstimate - 2000;

    const prompt = `You are a fitness business consultant AI. Analyze this personal trainer's data and provide 3-4 specific, actionable suggestions to grow their business.\n\nTotal Clients: ${totalClients}\nActive Clients: ${activeClients}\nEstimated Monthly Revenue: ₹${revenueEstimate}\nEstimated Profit: ₹${profit} (${profit >= 0 ? 'PROFIT' : 'LOSS'})\n\nProvide insights about: client retention, marketing, pricing strategies, and service expansion. Keep each point concise (1-2 sentences). Format as a numbered list.`;

    const suggestion = await generateQuickTip('system', prompt);

    ok(res, 'AI suggestions generated', { suggestions: suggestion });
  } catch (error) {
    next(error);
  }
};
