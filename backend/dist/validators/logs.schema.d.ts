import { z } from 'zod';
export declare const dailyLogSchema: z.ZodObject<{
    date: z.ZodString;
    weight: z.ZodOptional<z.ZodNumber>;
    diet: z.ZodOptional<z.ZodObject<{
        breakfast: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            grams: z.ZodOptional<z.ZodNumber>;
            calories: z.ZodOptional<z.ZodNumber>;
            protein: z.ZodOptional<z.ZodNumber>;
            vitamins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            minerals: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }, {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }>, "many">>;
        lunch: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            grams: z.ZodOptional<z.ZodNumber>;
            calories: z.ZodOptional<z.ZodNumber>;
            protein: z.ZodOptional<z.ZodNumber>;
            vitamins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            minerals: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }, {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }>, "many">>;
        dinner: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            grams: z.ZodOptional<z.ZodNumber>;
            calories: z.ZodOptional<z.ZodNumber>;
            protein: z.ZodOptional<z.ZodNumber>;
            vitamins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            minerals: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }, {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }>, "many">>;
        snacks: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            grams: z.ZodOptional<z.ZodNumber>;
            calories: z.ZodOptional<z.ZodNumber>;
            protein: z.ZodOptional<z.ZodNumber>;
            vitamins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            minerals: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }, {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }>, "many">>;
        totalCalories: z.ZodOptional<z.ZodNumber>;
        totalProtein: z.ZodOptional<z.ZodNumber>;
        totalCarbs: z.ZodOptional<z.ZodNumber>;
        totalFat: z.ZodOptional<z.ZodNumber>;
        waterIntake: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        breakfast?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        lunch?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        dinner?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        snacks?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        totalCalories?: number | undefined;
        totalProtein?: number | undefined;
        totalCarbs?: number | undefined;
        totalFat?: number | undefined;
        waterIntake?: number | undefined;
    }, {
        breakfast?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        lunch?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        dinner?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        snacks?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        totalCalories?: number | undefined;
        totalProtein?: number | undefined;
        totalCarbs?: number | undefined;
        totalFat?: number | undefined;
        waterIntake?: number | undefined;
    }>>;
    workout: z.ZodDefault<z.ZodArray<z.ZodObject<{
        exercise: z.ZodString;
        sets: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        reps: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        duration: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        caloriesBurned: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        isCompleted: z.ZodDefault<z.ZodBoolean>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        exercise: string;
        isCompleted: boolean;
        notes?: string | undefined;
        sets?: number | null | undefined;
        reps?: number | null | undefined;
        caloriesBurned?: number | null | undefined;
        duration?: number | null | undefined;
    }, {
        exercise: string;
        notes?: string | undefined;
        sets?: number | null | undefined;
        reps?: number | null | undefined;
        caloriesBurned?: number | null | undefined;
        isCompleted?: boolean | undefined;
        duration?: number | null | undefined;
    }>, "many">>;
    yoga: z.ZodDefault<z.ZodArray<z.ZodObject<{
        pose: z.ZodString;
        duration: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        isCompleted: z.ZodDefault<z.ZodBoolean>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        isCompleted: boolean;
        pose: string;
        notes?: string | undefined;
        duration?: number | null | undefined;
    }, {
        pose: string;
        notes?: string | undefined;
        isCompleted?: boolean | undefined;
        duration?: number | null | undefined;
    }>, "many">>;
    notes: z.ZodOptional<z.ZodString>;
    photoUrl: z.ZodOptional<z.ZodString>;
    mood: z.ZodOptional<z.ZodString>;
    energyLevel: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    date: string;
    workout: {
        exercise: string;
        isCompleted: boolean;
        notes?: string | undefined;
        sets?: number | null | undefined;
        reps?: number | null | undefined;
        caloriesBurned?: number | null | undefined;
        duration?: number | null | undefined;
    }[];
    yoga: {
        isCompleted: boolean;
        pose: string;
        notes?: string | undefined;
        duration?: number | null | undefined;
    }[];
    notes?: string | undefined;
    weight?: number | undefined;
    photoUrl?: string | undefined;
    diet?: {
        breakfast?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        lunch?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        dinner?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        snacks?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        totalCalories?: number | undefined;
        totalProtein?: number | undefined;
        totalCarbs?: number | undefined;
        totalFat?: number | undefined;
        waterIntake?: number | undefined;
    } | undefined;
    mood?: string | undefined;
    energyLevel?: number | undefined;
}, {
    date: string;
    notes?: string | undefined;
    weight?: number | undefined;
    photoUrl?: string | undefined;
    diet?: {
        breakfast?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        lunch?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        dinner?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        snacks?: {
            name: string;
            grams?: number | undefined;
            calories?: number | undefined;
            protein?: number | undefined;
            vitamins?: string[] | undefined;
            minerals?: string[] | undefined;
        }[] | undefined;
        totalCalories?: number | undefined;
        totalProtein?: number | undefined;
        totalCarbs?: number | undefined;
        totalFat?: number | undefined;
        waterIntake?: number | undefined;
    } | undefined;
    workout?: {
        exercise: string;
        notes?: string | undefined;
        sets?: number | null | undefined;
        reps?: number | null | undefined;
        caloriesBurned?: number | null | undefined;
        isCompleted?: boolean | undefined;
        duration?: number | null | undefined;
    }[] | undefined;
    yoga?: {
        pose: string;
        notes?: string | undefined;
        isCompleted?: boolean | undefined;
        duration?: number | null | undefined;
    }[] | undefined;
    mood?: string | undefined;
    energyLevel?: number | undefined;
}>;
export type DailyLogInput = z.infer<typeof dailyLogSchema>;
export declare const logHistoryQuerySchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodEnum<["diet", "workout", "yoga", "weight", "all"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "all" | "weight" | "diet" | "workout" | "yoga";
    limit: number;
    page: number;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    type?: "all" | "weight" | "diet" | "workout" | "yoga" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export declare const dateQuerySchema: z.ZodObject<{
    date: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    date?: string | undefined;
}, {
    date?: string | undefined;
}>;
//# sourceMappingURL=logs.schema.d.ts.map