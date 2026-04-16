"use strict";
// src/controllers/logs.controller.ts
// Daily logs and progress tracking
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgressSummary = exports.getLogHistory = exports.getDailyLog = exports.createDailyLog = void 0;
const db_1 = require("../config/db");
const helpers_1 = require("../utils/helpers");
const apiResponse_1 = require("../utils/apiResponse");
const helpers_2 = require("../utils/helpers");
const ai_service_1 = require("../services/ai.service");
// ─────────────────────────────────────────
// POST /logs/daily
// ─────────────────────────────────────────
const createDailyLog = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { date, weight, diet, workout, yoga, notes, photoUrl, mood, energyLevel } = req.body;
        const logDate = (0, helpers_2.parseDate)(date);
        // Calculate BMI if weight is provided
        let bmi;
        if (weight) {
            const user = await db_1.prisma.user.findUnique({ where: { id: userId }, select: { height: true } });
            if (user?.height) {
                bmi = (0, helpers_1.calculateBMI)(weight, user.height);
                // Update user's latest weight + BMI
                await db_1.prisma.user.update({ where: { id: userId }, data: { weight, bmi } });
            }
        }
        // Calculate streak
        const yesterday = new Date(logDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayLog = await db_1.prisma.progressLog.findUnique({ where: { userId_date: { userId, date: yesterday } } });
        const currentStreak = (yesterdayLog?.streak ?? 0) + 1;
        // Upsert the progress log
        const progressLog = await db_1.prisma.progressLog.upsert({
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
        // Handle diet log with background AI scanning
        if (diet) {
            let finalTotalCalories = diet.totalCalories || 0;
            let finalTotalProtein = diet.totalProtein || 0;
            // Identify and scan items that need AI estimation (name/grams present, but 0/missing macros)
            const meals = ['breakfast', 'lunch', 'dinner', 'snacks'];
            for (const mealKey of meals) {
                const mealItems = diet[mealKey];
                if (Array.isArray(mealItems)) {
                    for (let i = 0; i < mealItems.length; i++) {
                        const item = mealItems[i];
                        const needsScan = item.name && item.grams && (!item.calories || item.calories === 0);
                        if (needsScan) {
                            try {
                                const scan = await (0, ai_service_1.estimateSingleFoodNutrition)(item.name, parseFloat(String(item.grams)));
                                mealItems[i] = {
                                    ...item,
                                    calories: scan.calories,
                                    protein: scan.protein,
                                    carbs: scan.carbs,
                                    fat: scan.fat,
                                    vitamins: scan.vitamins,
                                    minerals: scan.minerals
                                };
                                // Accumulate to total if not already included
                                finalTotalCalories += scan.calories;
                                finalTotalProtein += scan.protein;
                            }
                            catch (e) {
                                console.error(`❌ Background scan failed for ${item.name}:`, e);
                            }
                        }
                    }
                }
            }
            const existingDiet = await db_1.prisma.dietLog.findFirst({
                where: { progressLogId: progressLog.id }
            });
            const dietData = {
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
                totalCalories: finalTotalCalories,
                totalProtein: finalTotalProtein,
                totalCarbs: diet.totalCarbs,
                totalFat: diet.totalFat,
                waterIntake: diet.waterIntake,
            };
            if (existingDiet) {
                await db_1.prisma.dietLog.update({
                    where: { id: existingDiet.id },
                    data: dietData,
                });
            }
            else {
                await db_1.prisma.dietLog.create({
                    data: {
                        progressLogId: progressLog.id,
                        ...dietData
                    },
                });
            }
        }
        // Create workout logs
        if (workout?.length > 0) {
            // Delete existing for this day and re-create
            await db_1.prisma.workoutLog.deleteMany({ where: { progressLogId: progressLog.id } });
            await db_1.prisma.workoutLog.createMany({
                data: workout.map((w) => ({
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
            await db_1.prisma.yogaLog.deleteMany({ where: { progressLogId: progressLog.id } });
            await db_1.prisma.yogaLog.createMany({
                data: yoga.map((y) => ({
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
            await db_1.prisma.notification.create({
                data: {
                    userId,
                    type: 'streak_milestone',
                    title: `🔥 ${currentStreak}-Day Streak!`,
                    body: `Amazing! You've logged for ${currentStreak} consecutive days. Keep it up!`,
                },
            });
        }
        (0, apiResponse_1.created)(res, `Daily log saved. ${currentStreak}-day streak!`, { streak: currentStreak, logId: progressLog.id });
    }
    catch (error) {
        next(error);
    }
};
exports.createDailyLog = createDailyLog;
// ─────────────────────────────────────────
// GET /logs/daily?date=YYYY-MM-DD
// ─────────────────────────────────────────
const getDailyLog = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const dateStr = req.query.date ?? new Date().toISOString().split('T')[0];
        const logDate = (0, helpers_2.parseDate)(dateStr);
        const log = await db_1.prisma.progressLog.findUnique({
            where: { userId_date: { userId, date: logDate } },
            include: { dietLog: true, workoutLogs: true, yogaLogs: true },
        });
        if (!log) {
            (0, apiResponse_1.notFound)(res, 'No log found for this date');
            return;
        }
        (0, apiResponse_1.ok)(res, 'Daily log retrieved', log);
    }
    catch (error) {
        next(error);
    }
};
exports.getDailyLog = getDailyLog;
// ─────────────────────────────────────────
// GET /logs/history
// ─────────────────────────────────────────
const getLogHistory = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate, type = 'all', page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const whereClause = { userId };
        if (startDate || endDate) {
            whereClause.date = {
                ...(startDate && { gte: (0, helpers_2.parseDate)(startDate) }),
                ...(endDate && { lte: (0, helpers_2.parseDate)(endDate) }),
            };
        }
        const [logs, total] = await Promise.all([
            db_1.prisma.progressLog.findMany({
                where: whereClause,
                skip,
                take: Number(limit),
                orderBy: { date: 'desc' },
                include: {
                    dietLog: type === 'diet' || type === 'all',
                    workoutLogs: type === 'workout' || type === 'all',
                    yogaLogs: type === 'yoga' || type === 'all',
                },
            }),
            db_1.prisma.progressLog.count({ where: whereClause }),
        ]);
        (0, apiResponse_1.ok)(res, 'Log history retrieved', logs, (0, helpers_2.buildPaginationMeta)(total, Number(page), Number(limit)));
    }
    catch (error) {
        next(error);
    }
};
exports.getLogHistory = getLogHistory;
// ─────────────────────────────────────────
// GET /progress/summary
// ─────────────────────────────────────────
// Helper: Calculate Mastery Score (0-100)
const calculateDailyScore = (log, targets) => {
    if (!log)
        return 0;
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
        const completed = exercises.filter((ex) => ex.isCompleted).length;
        score += (completed / exercises.length) * 50;
    }
    return Math.round(score);
};
const getProgressSummary = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { timeframe = 'monthly' } = req.query;
        const now = new Date();
        const activePlan = await db_1.prisma.aIPlan.findFirst({
            where: { userId, isActive: true },
            select: { estimatedCalories: true, generatedPlan: true },
        });
        const day1Plan = activePlan?.generatedPlan?.dailyPlan?.day1?.diet;
        const targets = {
            overall: activePlan?.estimatedCalories || 2000,
            breakfast: day1Plan?.m1_bk?.cal || 0,
            lunch: day1Plan?.m2_ln?.cal || 0,
            dinner: day1Plan?.m3_dn?.cal || 0,
        };
        let labels = [];
        let values = [];
        let summary = {};
        if (timeframe === 'daily') {
            const today = new Date(now.toISOString().split('T')[0]);
            const log = await db_1.prisma.progressLog.findFirst({
                where: { userId, date: today },
                include: { dietLog: true, workoutLogs: true },
            });
            labels = ['Workout', 'Breakfast', 'Lunch', 'Dinner'];
            const diet = log?.dietLog;
            values = [
                log?.workoutLogs?.filter((w) => w.isCompleted).length ? 100 : 0,
                diet?.breakfastCalories ? Math.round((diet.breakfastCalories / targets.breakfast) * 100) : 0,
                diet?.lunchCalories ? Math.round((diet.lunchCalories / targets.lunch) * 100) : 0,
                diet?.dinnerCalories ? Math.round((diet.dinnerCalories / targets.dinner) * 100) : 0,
            ];
            summary = { mastery: calculateDailyScore(log, targets) };
        }
        else if (timeframe === 'weekly') {
            // Find Monday of current week
            const day = now.getDay(); // 0 (Sun) to 6 (Sat)
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(now.setDate(diff));
            monday.setHours(0, 0, 0, 0);
            const logs = await db_1.prisma.progressLog.findMany({
                where: { userId, date: { gte: monday } },
                include: { dietLog: true, workoutLogs: true },
            });
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            values = labels.map((_, i) => {
                const d = new Date(monday);
                d.setDate(monday.getDate() + i);
                const log = logs.find((l) => l.date.toISOString().split('T')[0] === d.toISOString().split('T')[0]);
                return calculateDailyScore(log, targets);
            });
        }
        else {
            // Monthly (Full Year View)
            const thisYear = now.getFullYear();
            const logs = await db_1.prisma.progressLog.findMany({
                where: { userId, date: { gte: new Date(`${thisYear}-01-01`) } },
                include: { dietLog: true, workoutLogs: true },
            });
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            values = labels.map((_, monthIdx) => {
                const monthLogs = logs.filter((l) => l.date.getMonth() === monthIdx);
                if (monthLogs.length === 0)
                    return 0;
                const total = monthLogs.reduce((sum, l) => sum + calculateDailyScore(l, targets), 0);
                return Math.round(total / monthLogs.length);
            });
        }
        const logs30Days = await db_1.prisma.progressLog.findMany({
            where: { userId, date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
            include: { dietLog: true, workoutLogs: true },
        });
        const user = await db_1.prisma.user.findUnique({ where: { id: userId }, select: { weight: true, bmi: true } });
        const latestStreak = logs30Days[logs30Days.length - 1]?.streak || 0;
        (0, apiResponse_1.ok)(res, `Mastery summary (${timeframe}) retrieved`, {
            timeframe,
            streak: latestStreak,
            currentWeight: user?.weight,
            currentBmi: user?.bmi,
            totalWorkouts: logs30Days.reduce((s, l) => s + (l.workoutLogs?.length || 0), 0),
            avgCalories: Math.round(logs30Days.reduce((s, l) => s + (l.dietLog?.totalCalories || 0), 0) / (logs30Days.length || 1)),
            chartData: { labels, datasets: [{ data: values }] },
            summary,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProgressSummary = getProgressSummary;
//# sourceMappingURL=logs.controller.js.map