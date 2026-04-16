import { z } from 'zod';
export declare const generatePlanSchema: z.ZodObject<{
    age: z.ZodNumber;
    gender: z.ZodEnum<["male", "female", "other"]>;
    height: z.ZodNumber;
    weight: z.ZodNumber;
    medicalConditions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    goals: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    activityLevel: z.ZodDefault<z.ZodEnum<["sedentary", "lightly_active", "moderately_active", "very_active", "extra_active"]>>;
    preferences: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    durationDays: z.ZodDefault<z.ZodNumber>;
    bmi: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    gender: "male" | "female" | "other";
    age: number;
    height: number;
    weight: number;
    bmi: number;
    medicalConditions: string[];
    goals: string[];
    activityLevel: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active";
    preferences: string[];
    durationDays: number;
}, {
    gender: "male" | "female" | "other";
    age: number;
    height: number;
    weight: number;
    bmi?: number | undefined;
    medicalConditions?: string[] | undefined;
    goals?: string[] | undefined;
    activityLevel?: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active" | undefined;
    preferences?: string[] | undefined;
    durationDays?: number | undefined;
}>;
export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;
export declare const overridePlanSchema: z.ZodObject<{
    editedPlan: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    editedPlan: Record<string, unknown>;
    reason: string;
}, {
    editedPlan: Record<string, unknown>;
    reason: string;
}>;
export type OverridePlanInput = z.infer<typeof overridePlanSchema>;
export declare const planHistoryQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    limit?: number | undefined;
    page?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
//# sourceMappingURL=plan.schema.d.ts.map