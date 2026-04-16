"use strict";
// src/validators/logs.schema.ts
// Zod validation schemas for daily logs and progress
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateQuerySchema = exports.logHistoryQuerySchema = exports.dailyLogSchema = void 0;
const zod_1 = require("zod");
const workoutEntrySchema = zod_1.z.object({
    exercise: zod_1.z.string().min(1),
    sets: zod_1.z.number().int().nonnegative().nullable().optional(),
    reps: zod_1.z.number().int().nonnegative().nullable().optional(),
    duration: zod_1.z.number().nonnegative().nullable().optional(), // minutes
    caloriesBurned: zod_1.z.number().nonnegative().nullable().optional(),
    isCompleted: zod_1.z.boolean().default(true),
    notes: zod_1.z.string().optional(),
});
const yogaEntrySchema = zod_1.z.object({
    pose: zod_1.z.string().min(1),
    duration: zod_1.z.number().nonnegative().nullable().optional(), // minutes
    isCompleted: zod_1.z.boolean().default(true),
    notes: zod_1.z.string().optional(),
});
exports.dailyLogSchema = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    weight: zod_1.z.number().positive().optional(),
    diet: zod_1.z
        .object({
        breakfast: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            grams: zod_1.z.number().positive().optional(),
            calories: zod_1.z.number().nonnegative().optional(),
            protein: zod_1.z.number().nonnegative().optional(),
            vitamins: zod_1.z.array(zod_1.z.string()).optional(),
            minerals: zod_1.z.array(zod_1.z.string()).optional(),
        })).optional(),
        lunch: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            grams: zod_1.z.number().positive().optional(),
            calories: zod_1.z.number().nonnegative().optional(),
            protein: zod_1.z.number().nonnegative().optional(),
            vitamins: zod_1.z.array(zod_1.z.string()).optional(),
            minerals: zod_1.z.array(zod_1.z.string()).optional(),
        })).optional(),
        dinner: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            grams: zod_1.z.number().positive().optional(),
            calories: zod_1.z.number().nonnegative().optional(),
            protein: zod_1.z.number().nonnegative().optional(),
            vitamins: zod_1.z.array(zod_1.z.string()).optional(),
            minerals: zod_1.z.array(zod_1.z.string()).optional(),
        })).optional(),
        snacks: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            grams: zod_1.z.number().positive().optional(),
            calories: zod_1.z.number().nonnegative().optional(),
            protein: zod_1.z.number().nonnegative().optional(),
            vitamins: zod_1.z.array(zod_1.z.string()).optional(),
            minerals: zod_1.z.array(zod_1.z.string()).optional(),
        })).optional(),
        totalCalories: zod_1.z.number().nonnegative().optional(),
        totalProtein: zod_1.z.number().nonnegative().optional(),
        totalCarbs: zod_1.z.number().nonnegative().optional(),
        totalFat: zod_1.z.number().nonnegative().optional(),
        waterIntake: zod_1.z.number().nonnegative().optional(),
    })
        .optional(),
    workout: zod_1.z.array(workoutEntrySchema).default([]),
    yoga: zod_1.z.array(yogaEntrySchema).default([]),
    notes: zod_1.z.string().max(1000).optional(),
    photoUrl: zod_1.z.string().url().optional(),
    mood: zod_1.z.string().optional(),
    energyLevel: zod_1.z.number().int().min(1).max(10).optional(),
});
exports.logHistoryQuerySchema = zod_1.z.object({
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    type: zod_1.z.enum(['diet', 'workout', 'yoga', 'weight', 'all']).default('all'),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(50).default(10),
});
exports.dateQuerySchema = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});
//# sourceMappingURL=logs.schema.js.map