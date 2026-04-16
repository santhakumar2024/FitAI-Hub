// src/controllers/profile.controller.ts
// User profile management

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { ok, notFound } from '../utils/apiResponse';
import { calculateBMI } from '../utils/helpers';

// ─────────────────────────────────────────
// GET /profile/me
// ─────────────────────────────────────────
export const getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
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
      notFound(res, 'User not found');
      return;
    }

    // Get current streak
    const latestLog = await prisma.progressLog.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { streak: true },
    });

    ok(res, 'Profile retrieved', {
      ...user,
      subscriptionStatus: user.subscriptions[0]?.status,
      streak: latestLog?.streak ?? 0,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// PATCH /profile/me
// ─────────────────────────────────────────
export const updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { 
      name, goals, medicalConditions, photoUrl, phone, age, height, weight, 
      activityLevel, preferences, goalType, timeline, workoutLocation, 
      equipmentAccess, jobNature, trainingStyle, targetWeight, daysPerWeek, 
      timePerSession, fcmToken, themePreference 
    } = req.body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (goals !== undefined) updateData.goals = goals;
    if (medicalConditions !== undefined) updateData.medicalConditions = medicalConditions;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (phone !== undefined) updateData.phone = phone;
    if (age !== undefined) updateData.age = age;
    if (height !== undefined) updateData.height = height;
    if (weight !== undefined) updateData.weight = weight;
    if (activityLevel !== undefined) updateData.activityLevel = activityLevel;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (fcmToken !== undefined) updateData.fcmToken = fcmToken;
    
    // New Mastery Fields
    if (goalType !== undefined) updateData.goalType = goalType;
    if (timeline !== undefined) updateData.timeline = timeline;
    if (workoutLocation !== undefined) updateData.workoutLocation = workoutLocation;
    if (equipmentAccess !== undefined) updateData.equipmentAccess = equipmentAccess;
    if (jobNature !== undefined) updateData.jobNature = jobNature;
    if (trainingStyle !== undefined) updateData.trainingStyle = trainingStyle;
    if (targetWeight !== undefined) updateData.targetWeight = targetWeight;
    if (daysPerWeek !== undefined) updateData.daysPerWeek = daysPerWeek;
    if (timePerSession !== undefined) updateData.timePerSession = timePerSession;
    if (themePreference !== undefined) updateData.themePreference = themePreference;

    // Recalculate BMI if height/weight updated
    if (height || weight) {
      const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { height: true, weight: true } });
      const finalHeight = (height ?? currentUser?.height) as number;
      const finalWeight = (weight ?? currentUser?.weight) as number;
      if (finalHeight && finalWeight) {
        updateData.bmi = calculateBMI(finalWeight, finalHeight);
      }
    }

    const updated = await prisma.user.update({
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

    ok(res, 'Profile updated successfully', updated);
  } catch (error) {
    next(error);
  }
};
