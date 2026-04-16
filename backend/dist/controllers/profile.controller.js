"use strict";
// src/controllers/profile.controller.ts
// User profile management
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMyProfile = exports.getMyProfile = void 0;
const db_1 = require("../config/db");
const apiResponse_1 = require("../utils/apiResponse");
const helpers_1 = require("../utils/helpers");
// ─────────────────────────────────────────
// GET /profile/me
// ─────────────────────────────────────────
const getMyProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true, name: true, email: true, phone: true, role: true, isFreelance: true,
                age: true, gender: true, height: true, weight: true, bmi: true, photoUrl: true,
                medicalConditions: true, goals: true, activityLevel: true, preferences: true,
                goalType: true, timeline: true, workoutLocation: true, equipmentAccess: true,
                jobNature: true, trainingStyle: true, targetWeight: true, daysPerWeek: true,
                timePerSession: true, themePreference: true,
                isEmailVerified: true, lastLoginAt: true, createdAt: true,
                subscriptions: {
                    select: { status: true, planType: true, trialEndsAt: true, currentPeriodEnd: true },
                    take: 1,
                    orderBy: { createdAt: 'desc' }
                },
                gym: { select: { id: true, name: true } },
            },
        });
        if (!user) {
            (0, apiResponse_1.notFound)(res, 'User not found');
            return;
        }
        // Get current streak
        const latestLog = await db_1.prisma.progressLog.findFirst({
            where: { userId },
            orderBy: { date: 'desc' },
            select: { streak: true },
        });
        (0, apiResponse_1.ok)(res, 'Profile retrieved', {
            ...user,
            subscriptionStatus: user.subscriptions[0]?.status,
            streak: latestLog?.streak ?? 0,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyProfile = getMyProfile;
// ─────────────────────────────────────────
// PATCH /profile/me
// ─────────────────────────────────────────
const updateMyProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { name, goals, medicalConditions, photoUrl, phone, age, height, weight, activityLevel, preferences, goalType, timeline, workoutLocation, equipmentAccess, jobNature, trainingStyle, targetWeight, daysPerWeek, timePerSession, fcmToken, themePreference } = req.body;
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (goals !== undefined)
            updateData.goals = goals;
        if (medicalConditions !== undefined)
            updateData.medicalConditions = medicalConditions;
        if (photoUrl !== undefined)
            updateData.photoUrl = photoUrl;
        if (phone !== undefined)
            updateData.phone = phone;
        if (age !== undefined)
            updateData.age = age;
        if (height !== undefined)
            updateData.height = height;
        if (weight !== undefined)
            updateData.weight = weight;
        if (activityLevel !== undefined)
            updateData.activityLevel = activityLevel;
        if (preferences !== undefined)
            updateData.preferences = preferences;
        if (fcmToken !== undefined)
            updateData.fcmToken = fcmToken;
        // New Mastery Fields
        if (goalType !== undefined)
            updateData.goalType = goalType;
        if (timeline !== undefined)
            updateData.timeline = timeline;
        if (workoutLocation !== undefined)
            updateData.workoutLocation = workoutLocation;
        if (equipmentAccess !== undefined)
            updateData.equipmentAccess = equipmentAccess;
        if (jobNature !== undefined)
            updateData.jobNature = jobNature;
        if (trainingStyle !== undefined)
            updateData.trainingStyle = trainingStyle;
        if (targetWeight !== undefined)
            updateData.targetWeight = targetWeight;
        if (daysPerWeek !== undefined)
            updateData.daysPerWeek = daysPerWeek;
        if (timePerSession !== undefined)
            updateData.timePerSession = timePerSession;
        if (themePreference !== undefined)
            updateData.themePreference = themePreference;
        // Recalculate BMI if height/weight updated
        if (height || weight) {
            const currentUser = await db_1.prisma.user.findUnique({ where: { id: userId }, select: { height: true, weight: true } });
            const finalHeight = (height ?? currentUser?.height);
            const finalWeight = (weight ?? currentUser?.weight);
            if (finalHeight && finalWeight) {
                updateData.bmi = (0, helpers_1.calculateBMI)(finalWeight, finalHeight);
            }
        }
        const updated = await db_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true, name: true, email: true, phone: true, role: true, age: true,
                gender: true, height: true, weight: true, bmi: true, photoUrl: true,
                goals: true, medicalConditions: true, activityLevel: true,
                goalType: true, timeline: true, workoutLocation: true, equipmentAccess: true,
                jobNature: true, trainingStyle: true, themePreference: true,
            },
        });
        (0, apiResponse_1.ok)(res, 'Profile updated successfully', updated);
    }
    catch (error) {
        next(error);
    }
};
exports.updateMyProfile = updateMyProfile;
//# sourceMappingURL=profile.controller.js.map