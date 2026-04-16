// src/validators/plan.schema.ts
// Zod validation schemas for AI plans and overrides

import { z } from 'zod';

export const generatePlanSchema = z.object({
  age: z.number().int().min(10).max(100),
  gender: z.enum(['male', 'female', 'other']),
  height: z.number().min(50).max(300), // cm
  weight: z.number().min(10).max(500), // kg
  medicalConditions: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  activityLevel: z
    .enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'])
    .default('moderately_active'),
  preferences: z.array(z.string()).default([]),
  durationDays: z.number().int().min(1).max(30).default(7),
  bmi: z.number().optional().default(0),
});

export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;

export const overridePlanSchema = z.object({
  editedPlan: z.record(z.unknown()),
  reason: z.string().min(5, 'Please provide a reason for the override').max(500),
});

export type OverridePlanInput = z.infer<typeof overridePlanSchema>;

export const planHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
