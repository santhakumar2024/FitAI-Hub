// src/validators/logs.schema.ts
// Zod validation schemas for daily logs and progress

import { z } from 'zod';

const workoutEntrySchema = z.object({
  exercise: z.string().min(1),
  sets: z.number().int().nonnegative().nullable().optional(),
  reps: z.number().int().nonnegative().nullable().optional(),
  duration: z.number().nonnegative().nullable().optional(), // minutes
  caloriesBurned: z.number().nonnegative().nullable().optional(),
  isCompleted: z.boolean().default(true),
  notes: z.string().optional(),
});

const yogaEntrySchema = z.object({
  pose: z.string().min(1),
  duration: z.number().nonnegative().nullable().optional(), // minutes
  isCompleted: z.boolean().default(true),
  notes: z.string().optional(),
});

export const dailyLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  weight: z.number().positive().optional(),
  diet: z
    .object({
      breakfast: z.array(z.object({
        name: z.string(),
        grams: z.number().positive().optional(),
        calories: z.number().nonnegative().optional(),
        protein: z.number().nonnegative().optional(),
        vitamins: z.array(z.string()).optional(),
        minerals: z.array(z.string()).optional(),
      })).optional(),
      lunch: z.array(z.object({
        name: z.string(),
        grams: z.number().positive().optional(),
        calories: z.number().nonnegative().optional(),
        protein: z.number().nonnegative().optional(),
        vitamins: z.array(z.string()).optional(),
        minerals: z.array(z.string()).optional(),
      })).optional(),
      dinner: z.array(z.object({
        name: z.string(),
        grams: z.number().positive().optional(),
        calories: z.number().nonnegative().optional(),
        protein: z.number().nonnegative().optional(),
        vitamins: z.array(z.string()).optional(),
        minerals: z.array(z.string()).optional(),
      })).optional(),
      snacks: z.array(z.object({
        name: z.string(),
        grams: z.number().positive().optional(),
        calories: z.number().nonnegative().optional(),
        protein: z.number().nonnegative().optional(),
        vitamins: z.array(z.string()).optional(),
        minerals: z.array(z.string()).optional(),
      })).optional(),
      totalCalories: z.number().nonnegative().optional(),
      totalProtein: z.number().nonnegative().optional(),
      totalCarbs: z.number().nonnegative().optional(),
      totalFat: z.number().nonnegative().optional(),
      waterIntake: z.number().nonnegative().optional(),
    })
    .optional(),
  workout: z.array(workoutEntrySchema).default([]),
  yoga: z.array(yogaEntrySchema).default([]),
  notes: z.string().max(1000).optional(),
  photoUrl: z.string().url().optional(),
  mood: z.string().optional(),
  energyLevel: z.number().int().min(1).max(10).optional(),
});

export type DailyLogInput = z.infer<typeof dailyLogSchema>;

export const logHistoryQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(['diet', 'workout', 'yoga', 'weight', 'all']).default('all'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export const dateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});
