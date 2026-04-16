import { GeneratePlanInput } from '../validators/plan.schema';
export declare const generateAIPlan: (userId: string, input: GeneratePlanInput) => Promise<Record<string, unknown>>;
export declare const generateQuickTip: (userId: string, context: string) => Promise<string>;
export declare const estimateCaloriesFromAI: (meals: string[]) => Promise<any>;
export declare const estimateSingleFoodNutrition: (name: string, grams: number) => Promise<any>;
//# sourceMappingURL=ai.service.d.ts.map