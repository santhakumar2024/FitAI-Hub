import { z } from 'zod';
export declare const registerSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodEnum<["NORMAL_USER", "GYM_OWNER", "TRAINER"]>>;
    isFreelance: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    age: z.ZodOptional<z.ZodNumber>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female", "other"]>>;
    height: z.ZodOptional<z.ZodNumber>;
    weight: z.ZodOptional<z.ZodNumber>;
    bmi: z.ZodOptional<z.ZodNumber>;
    medicalConditions: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    goals: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    activityLevel: z.ZodOptional<z.ZodEnum<["sedentary", "lightly_active", "moderately_active", "very_active", "extra_active"]>>;
    preferences: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    password: string;
    name: string;
    email: string;
    role: "NORMAL_USER" | "GYM_OWNER" | "TRAINER";
    isFreelance: boolean;
    medicalConditions: string[];
    goals: string[];
    preferences: string[];
    confirmPassword: string;
    phone?: string | undefined;
    gender?: "male" | "female" | "other" | undefined;
    age?: number | undefined;
    height?: number | undefined;
    weight?: number | undefined;
    bmi?: number | undefined;
    activityLevel?: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active" | undefined;
}, {
    password: string;
    name: string;
    email: string;
    confirmPassword: string;
    phone?: string | undefined;
    role?: "NORMAL_USER" | "GYM_OWNER" | "TRAINER" | undefined;
    isFreelance?: boolean | undefined;
    gender?: "male" | "female" | "other" | undefined;
    age?: number | undefined;
    height?: number | undefined;
    weight?: number | undefined;
    bmi?: number | undefined;
    medicalConditions?: string[] | undefined;
    goals?: string[] | undefined;
    activityLevel?: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active" | undefined;
    preferences?: string[] | undefined;
}>, {
    password: string;
    name: string;
    email: string;
    role: "NORMAL_USER" | "GYM_OWNER" | "TRAINER";
    isFreelance: boolean;
    medicalConditions: string[];
    goals: string[];
    preferences: string[];
    confirmPassword: string;
    phone?: string | undefined;
    gender?: "male" | "female" | "other" | undefined;
    age?: number | undefined;
    height?: number | undefined;
    weight?: number | undefined;
    bmi?: number | undefined;
    activityLevel?: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active" | undefined;
}, {
    password: string;
    name: string;
    email: string;
    confirmPassword: string;
    phone?: string | undefined;
    role?: "NORMAL_USER" | "GYM_OWNER" | "TRAINER" | undefined;
    isFreelance?: boolean | undefined;
    gender?: "male" | "female" | "other" | undefined;
    age?: number | undefined;
    height?: number | undefined;
    weight?: number | undefined;
    bmi?: number | undefined;
    medicalConditions?: string[] | undefined;
    goals?: string[] | undefined;
    activityLevel?: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active" | undefined;
    preferences?: string[] | undefined;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    age: z.ZodOptional<z.ZodNumber>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female", "other"]>>;
    height: z.ZodOptional<z.ZodNumber>;
    weight: z.ZodOptional<z.ZodNumber>;
    photoUrl: z.ZodOptional<z.ZodString>;
    work: z.ZodOptional<z.ZodString>;
    mobileNumber: z.ZodOptional<z.ZodString>;
    goalType: z.ZodOptional<z.ZodString>;
    targetWeight: z.ZodOptional<z.ZodNumber>;
    timeline: z.ZodOptional<z.ZodString>;
    motivationLevel: z.ZodOptional<z.ZodNumber>;
    experienceLevel: z.ZodOptional<z.ZodString>;
    recentActivity: z.ZodOptional<z.ZodNumber>;
    pushupTest: z.ZodOptional<z.ZodNumber>;
    squatTest: z.ZodOptional<z.ZodNumber>;
    workoutLocation: z.ZodOptional<z.ZodString>;
    equipmentAccess: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    daysPerWeek: z.ZodOptional<z.ZodNumber>;
    timePerSession: z.ZodOptional<z.ZodNumber>;
    jobNature: z.ZodOptional<z.ZodString>;
    dislikedExercises: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    trainingStyle: z.ZodOptional<z.ZodString>;
    medicalConditions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    medicalScreening: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    goals: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    activityLevel: z.ZodOptional<z.ZodEnum<["sedentary", "lightly_active", "moderately_active", "very_active", "extra_active"]>>;
    preferences: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    gender?: "male" | "female" | "other" | undefined;
    age?: number | undefined;
    height?: number | undefined;
    weight?: number | undefined;
    photoUrl?: string | undefined;
    medicalConditions?: string[] | undefined;
    goals?: string[] | undefined;
    activityLevel?: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active" | undefined;
    preferences?: string[] | undefined;
    daysPerWeek?: number | undefined;
    dislikedExercises?: string[] | undefined;
    equipmentAccess?: string[] | undefined;
    experienceLevel?: string | undefined;
    goalType?: string | undefined;
    jobNature?: string | undefined;
    medicalScreening?: Record<string, any> | undefined;
    mobileNumber?: string | undefined;
    motivationLevel?: number | undefined;
    pushupTest?: number | undefined;
    recentActivity?: number | undefined;
    squatTest?: number | undefined;
    targetWeight?: number | undefined;
    timePerSession?: number | undefined;
    timeline?: string | undefined;
    trainingStyle?: string | undefined;
    work?: string | undefined;
    workoutLocation?: string | undefined;
}, {
    name?: string | undefined;
    gender?: "male" | "female" | "other" | undefined;
    age?: number | undefined;
    height?: number | undefined;
    weight?: number | undefined;
    photoUrl?: string | undefined;
    medicalConditions?: string[] | undefined;
    goals?: string[] | undefined;
    activityLevel?: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active" | undefined;
    preferences?: string[] | undefined;
    daysPerWeek?: number | undefined;
    dislikedExercises?: string[] | undefined;
    equipmentAccess?: string[] | undefined;
    experienceLevel?: string | undefined;
    goalType?: string | undefined;
    jobNature?: string | undefined;
    medicalScreening?: Record<string, any> | undefined;
    mobileNumber?: string | undefined;
    motivationLevel?: number | undefined;
    pushupTest?: number | undefined;
    recentActivity?: number | undefined;
    squatTest?: number | undefined;
    targetWeight?: number | undefined;
    timePerSession?: number | undefined;
    timeline?: string | undefined;
    trainingStyle?: string | undefined;
    work?: string | undefined;
    workoutLocation?: string | undefined;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
}, {
    password: string;
    email: string;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    newPassword: string;
}, {
    token: string;
    newPassword: string;
}>;
export declare const verifyOtpSchema: z.ZodObject<{
    phone: z.ZodString;
    otp: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phone: string;
    otp: string;
}, {
    phone: string;
    otp: string;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newPassword: string;
    currentPassword: string;
}, {
    newPassword: string;
    currentPassword: string;
}>;
//# sourceMappingURL=auth.schema.d.ts.map