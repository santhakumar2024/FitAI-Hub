"use strict";
// src/validators/plan.schema.ts
// Zod validation schemas for AI plans and overrides
Object.defineProperty(exports, "__esModule", { value: true });
exports.planHistoryQuerySchema = exports.overridePlanSchema = exports.generatePlanSchema = void 0;
const zod_1 = require("zod");
exports.generatePlanSchema = zod_1.z.object({
    age: zod_1.z.number().int().min(10).max(100),
    gender: zod_1.z.enum(['male', 'female', 'other']),
    height: zod_1.z.number().min(50).max(300), // cm
    weight: zod_1.z.number().min(10).max(500), // kg
    medicalConditions: zod_1.z.array(zod_1.z.string()).default([]),
    goals: zod_1.z.array(zod_1.z.string()).default([]),
    activityLevel: zod_1.z
        .enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'])
        .default('moderately_active'),
    preferences: zod_1.z.array(zod_1.z.string()).default([]),
    durationDays: zod_1.z.number().int().min(1).max(30).default(7),
    bmi: zod_1.z.number().optional().default(0),
});
exports.overridePlanSchema = zod_1.z.object({
    editedPlan: zod_1.z.record(zod_1.z.unknown()),
    reason: zod_1.z.string().min(5, 'Please provide a reason for the override').max(500),
});
exports.planHistoryQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(50).default(10),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
});
//# sourceMappingURL=plan.schema.js.map