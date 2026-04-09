// src/controllers/logs.controller.ts
// Daily logs and progress tracking

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { calculateBMI } from '../utils/helpers';
import { ok, created, notFound } from '../utils/apiResponse';
import { parseDate, buildPaginationMeta } from '../utils/helpers';

// ─────────────────────────────────────────
// POST /logs/daily
// ─────────────────────────────────────────
export const createDailyLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { date, weight, diet, workout, yoga, notes, photoUrl, mood, energyLevel } = req.body;

    const logDate = parseDate(date);

    // Calculate BMI if weight is provided
    let bmi: number | undefined;
    if (weight) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { height: true } });
      if (user?.height) {
        bmi = calculateBMI(weight, user.height);
        // Update user's latest weight + BMI
        await prisma.user.update({ where: { id: userId }, data: { weight, bmi } });
      }
    }

    // Calculate streak
    const yesterday = new Date(logDate);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayLog = await prisma.progressLog.findUnique({ where: { userId_date: { userId, date: yesterday } } });
    const currentStreak = (yesterdayLog?.streak ?? 0) + 1;

    // Upsert the progress log
    const progressLog = await prisma.progressLog.upsert({
      where: { userId_date: { userId, date: logDate } },
      create: {
        userId,
        date: logDate,
        weight,
        bmi,
        photoUrl,
        notes,
        mood,
        energyLevel,
        streak: currentStreak,
      },
      update: {
        weight: weight ?? undefined,
        bmi: bmi ?? undefined,
        photoUrl: photoUrl ?? undefined,
        notes: notes ?? undefined,
        mood: mood ?? undefined,
        energyLevel: energyLevel ?? undefined,
      },
    });

    // Handle diet log
    if (diet) {
      const existingDiet = await (prisma.dietLog as any).findFirst({
        where: { progressLogId: progressLog.id }
      });

      if (existingDiet) {
        await (prisma.dietLog as any).update({
          where: { id: existingDiet.id },
          data: {
            breakfast: diet.breakfast,
            lunch: diet.lunch,
            dinner: diet.dinner,
            snacks: diet.snacks,
            breakfastCalories: diet.breakfastCalories,
            breakfastProtein: diet.breakfastProtein,
            lunchCalories: diet.lunchCalories,
            lunchProtein: diet.lunchProtein,
            dinnerCalories: diet.dinnerCalories,
            dinnerProtein: diet.dinnerProtein,
            snackCalories: diet.snackCalories,
            snackProtein: diet.snackProtein,
            totalCalories: diet.totalCalories,
            totalProtein: diet.totalProtein,
            totalCarbs: diet.totalCarbs,
            totalFat: diet.totalFat,
            waterIntake: diet.waterIntake,
          },
        });
      } else {
        await (prisma.dietLog as any).create({
          data: {
            progressLogId: progressLog.id,
            ...diet
          },
        });
      }
    }

    // Create workout logs
    if (workout?.length > 0) {
      // Delete existing for this day and re-create
      await prisma.workoutLog.deleteMany({ where: { progressLogId: progressLog.id } });
      await prisma.workoutLog.createMany({
        data: workout.map((w: any) => ({
          progressLogId: progressLog.id,
          exercise: w.exercise,
          sets: w.sets,
          reps: w.reps,
          durationMinutes: w.duration,
          caloriesBurned: w.caloriesBurned,
          isCompleted: w.isCompleted ?? true,
          notes: w.notes,
        })),
      });
    }

    // Create yoga logs
    if (yoga?.length > 0) {
      await prisma.yogaLog.deleteMany({ where: { progressLogId: progressLog.id } });
      await prisma.yogaLog.createMany({
        data: yoga.map((y: any) => ({
          progressLogId: progressLog.id,
          pose: y.pose,
          durationMinutes: y.duration,
          isCompleted: y.isCompleted ?? true,
          notes: y.notes,
        })),
      });
    }

    // Streak milestone notifications
    const milestones = [3, 7, 14, 21, 30, 60, 90, 100];
    if (milestones.includes(currentStreak)) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'streak_milestone',
          title: `🔥 ${currentStreak}-Day Streak!`,
          body: `Amazing! You've logged for ${currentStreak} consecutive days. Keep it up!`,
        },
      });
    }

    created(res, `Daily log saved. ${currentStreak}-day streak!`, { streak: currentStreak, logId: progressLog.id });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /logs/daily?date=YYYY-MM-DD
// ─────────────────────────────────────────
export const getDailyLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const dateStr = (req.query.date as string) ?? new Date().toISOString().split('T')[0];
    const logDate = parseDate(dateStr);

    const log = await prisma.progressLog.findUnique({
      where: { userId_date: { userId, date: logDate } },
      include: { dietLog: true, workoutLogs: true, yogaLogs: true } as any,
    });

    if (!log) {
      notFound(res, 'No log found for this date');
      return;
    }

    ok(res, 'Daily log retrieved', log);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /logs/history
// ─────────────────────────────────────────
export const getLogHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { startDate, endDate, type = 'all', page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const whereClause: Record<string, unknown> = { userId };

    if (startDate || endDate) {
      whereClause.date = {
        ...(startDate && { gte: parseDate(startDate as string) }),
        ...(endDate && { lte: parseDate(endDate as string) }),
      };
    }

    const [logs, total] = await Promise.all([
      prisma.progressLog.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        orderBy: { date: 'desc' },
        include: {
          dietLog: type === 'diet' || type === 'all',
          workoutLogs: type === 'workout' || type === 'all',
          yogaLogs: type === 'yoga' || type === 'all',
        } as any,
      }),
      prisma.progressLog.count({ where: whereClause }),
    ]);

    ok(res, 'Log history retrieved', logs, buildPaginationMeta(total, Number(page), Number(limit)));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// GET /progress/summary
// ─────────────────────────────────────────
// Helper: Calculate Mastery Score (0-100)
const calculateDailyScore = (log: any, targets: any): number => {
  if (!log) return 0;
  let score = 0;
  
  // 1. Diet Adherence (50 points)
  const intake = log.dietLog?.totalCalories || 0;
  const target = targets.overall || 2000;
  if (intake > 0) {
    const diff = Math.abs(intake - target);
    const accuracy = Math.max(0, 1 - diff / target);
    score += accuracy * 50;
  }

  // 2. Workout Completion (50 points)
  const exercises = log.workoutLogs || [];
  if (exercises.length > 0) {
    const completed = exercises.filter((ex: any) => ex.isCompleted).length;
    score += (completed / exercises.length) * 50;
  }

  return Math.round(score);
};

export const getProgressSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { timeframe = 'monthly' } = req.query;

    const now = new Date();
    const activePlan = await prisma.aIPlan.findFirst({
      where: { userId, isActive: true },
      select: { estimatedCalories: true, generatedPlan: true },
    });

    const day1Plan = (activePlan?.generatedPlan as any)?.dailyPlan?.day1?.diet;
    const targets = {
      overall: activePlan?.estimatedCalories || 2000,
      breakfast: day1Plan?.m1_bk?.cal || 0,
      lunch: day1Plan?.m2_ln?.cal || 0,
      dinner: day1Plan?.m3_dn?.cal || 0,
    };

    let labels: string[] = [];
    let values: number[] = [];
    let summary: any = {};

    if (timeframe === 'daily') {
      const today = new Date(now.toISOString().split('T')[0]);
      const log = await prisma.progressLog.findFirst({
        where: { userId, date: today },
        include: { dietLog: true, workoutLogs: true } as any,
      });

      labels = ['Workout', 'Breakfast', 'Lunch', 'Dinner'];
      const diet = (log as any)?.dietLog;
      values = [
        log?.workoutLogs?.filter((w: any) => w.isCompleted).length ? 100 : 0,
        diet?.breakfastCalories ? Math.round((diet.breakfastCalories / targets.breakfast) * 100) : 0,
        diet?.lunchCalories ? Math.round((diet.lunchCalories / targets.lunch) * 100) : 0,
        diet?.dinnerCalories ? Math.round((diet.dinnerCalories / targets.dinner) * 100) : 0,
      ];
      summary = { mastery: calculateDailyScore(log, targets) };

    } else if (timeframe === 'weekly') {
      // Find Monday of current week
      const day = now.getDay(); // 0 (Sun) to 6 (Sat)
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
      const monday = new Date(now.setDate(diff));
      monday.setHours(0, 0, 0, 0);

      const logs = await prisma.progressLog.findMany({
        where: { userId, date: { gte: monday } },
        include: { dietLog: true, workoutLogs: true } as any,
      });

      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      values = labels.map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const log = logs.find((l) => l.date.toISOString().split('T')[0] === d.toISOString().split('T')[0]);
        return calculateDailyScore(log, targets);
      });

    } else {
      // Monthly (Full Year View)
      const thisYear = now.getFullYear();
      const logs = await prisma.progressLog.findMany({
        where: { userId, date: { gte: new Date(`${thisYear}-01-01`) } },
        include: { dietLog: true, workoutLogs: true } as any,
      });

      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      values = labels.map((_, monthIdx) => {
        const monthLogs = logs.filter((l) => l.date.getMonth() === monthIdx);
        if (monthLogs.length === 0) return 0;
        const total = monthLogs.reduce((sum, l) => sum + calculateDailyScore(l, targets), 0);
        return Math.round(total / monthLogs.length);
      });
    }

    const logs30Days = await prisma.progressLog.findMany({
      where: { userId, date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      include: { dietLog: true, workoutLogs: true } as any,
    });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { weight: true, bmi: true } });
    const latestStreak = logs30Days[logs30Days.length - 1]?.streak || 0;

    ok(res, `Mastery summary (${timeframe}) retrieved`, {
      timeframe,
      streak: latestStreak,
      currentWeight: user?.weight,
      currentBmi: user?.bmi,
      totalWorkouts: logs30Days.reduce((s, l: any) => s + (l.workoutLogs?.length || 0), 0),
      avgCalories: Math.round(logs30Days.reduce((s, l: any) => s + (l.dietLog?.totalCalories || 0), 0) / (logs30Days.length || 1)),
      chartData: { labels, datasets: [{ data: values }] },
      summary,
    });
  } catch (error) {
    next(error);
  }
};
