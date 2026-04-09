// prisma/seed.ts
// FitAI Hub — Database Seed Data
// Run: npm run seed

import { PrismaClient, Role, Gender, ActivityLevel, SubscriptionStatus, PlanType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data (in order of dependencies)
  await prisma.notification.deleteMany();
  await prisma.oTPCode.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.yogaLog.deleteMany();
  await prisma.workoutLog.deleteMany();
  await prisma.dietLog.deleteMany();
  await prisma.progressLog.deleteMany();
  await prisma.aIPlan.deleteMany();
  await prisma.trainerNote.deleteMany();
  await prisma.clientTrainer.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.gym.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('FitAI@2026', 12);
  const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // ─────────────────────────────────────────
  // 1. GYM OWNER
  // ─────────────────────────────────────────
  const gymOwner = await prisma.user.create({
    data: {
      name: 'Rajesh Kumar',
      email: 'owner@fitaihub.com',
      password: hashedPassword,
      phone: '+919876500001',
      role: Role.GYM_OWNER,
      gender: Gender.male,
      age: 42,
      height: 175,
      weight: 80,
      bmi: 26.1,
      isEmailVerified: true,
      medicalConditions: [],
      goals: ['build business', 'health management'],
      activityLevel: ActivityLevel.lightly_active,
    },
  });

  // Subscription for Owner
  await prisma.subscription.create({
    data: {
      userId: gymOwner.id,
      planType: PlanType.OWNER_500,
      status: SubscriptionStatus.trial,
      trialEndsAt,
    },
  });

  // ─────────────────────────────────────────
  // 2. GYM
  // ─────────────────────────────────────────
  const gym = await prisma.gym.create({
    data: {
      name: 'FitZone Erode',
      address: '123, Erode Main Road, Perundurai',
      city: 'Erode',
      state: 'Tamil Nadu',
      pincode: '638052',
      phone: '+914294223456',
      email: 'fitzone@erode.com',
      ownerId: gymOwner.id,
    },
  });

  // ─────────────────────────────────────────
  // 3. GYM TRAINER
  // ─────────────────────────────────────────
  const gymTrainer = await prisma.user.create({
    data: {
      name: 'Priya Devi',
      email: 'trainer@fitaihub.com',
      password: hashedPassword,
      phone: '+919876500002',
      role: Role.TRAINER,
      isFreelance: false,
      gender: Gender.female,
      age: 30,
      height: 162,
      weight: 58,
      bmi: 22.1,
      isEmailVerified: true,
      gymId: gym.id,
      medicalConditions: [],
      goals: ['train clients', 'professional growth'],
      activityLevel: ActivityLevel.very_active,
    },
  });

  await prisma.subscription.create({
    data: {
      userId: gymTrainer.id,
      planType: PlanType.FREELANCER_200,
      status: SubscriptionStatus.trial,
      trialEndsAt,
    },
  });

  // ─────────────────────────────────────────
  // 4. FREELANCE TRAINER
  // ─────────────────────────────────────────
  const freelanceTrainer = await prisma.user.create({
    data: {
      name: 'Arjun Fitness',
      email: 'freelancer@fitaihub.com',
      password: hashedPassword,
      phone: '+919876500003',
      role: Role.TRAINER,
      isFreelance: true,
      gender: Gender.male,
      age: 35,
      height: 180,
      weight: 82,
      bmi: 25.3,
      isEmailVerified: true,
      medicalConditions: [],
      goals: ['grow client base', 'online training'],
      activityLevel: ActivityLevel.very_active,
    },
  });

  await prisma.subscription.create({
    data: {
      userId: freelanceTrainer.id,
      planType: PlanType.FREELANCER_200,
      status: SubscriptionStatus.active,
      trialEndsAt: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amount: 20000,
    },
  });

  // ─────────────────────────────────────────
  // 5. NORMAL USER (Gym Member)
  // ─────────────────────────────────────────
  const normalUser = await prisma.user.create({
    data: {
      name: 'Santhakumar J.S',
      email: 'user@fitaihub.com',
      password: hashedPassword,
      phone: '+919876500004',
      role: Role.NORMAL_USER,
      gender: Gender.male,
      age: 28,
      height: 170,
      weight: 75,
      bmi: 25.95,
      isEmailVerified: true,
      medicalConditions: ['hypertension', 'knee pain'],
      goals: ['weight loss', 'improve stamina'],
      activityLevel: ActivityLevel.moderately_active,
      preferences: ['vegetarian'],
    },
  });

  await prisma.subscription.create({
    data: {
      userId: normalUser.id,
      planType: PlanType.NORMAL_100,
      status: SubscriptionStatus.trial,
      trialEndsAt,
    },
  });

  // ─────────────────────────────────────────
  // 6. FREELANCE CLIENT
  // ─────────────────────────────────────────
  const freelanceClient = await prisma.user.create({
    data: {
      name: 'Kavitha S',
      email: 'client2@fitaihub.com',
      password: hashedPassword,
      phone: '+919876500005',
      role: Role.NORMAL_USER,
      gender: Gender.female,
      age: 25,
      height: 160,
      weight: 65,
      bmi: 25.4,
      isEmailVerified: true,
      medicalConditions: ['thyroid'],
      goals: ['weight loss', 'muscle tone'],
      activityLevel: ActivityLevel.lightly_active,
    },
  });

  await prisma.subscription.create({
    data: {
      userId: freelanceClient.id,
      planType: PlanType.NORMAL_100,
      status: SubscriptionStatus.trial,
      trialEndsAt,
    },
  });

  // ─────────────────────────────────────────
  // 7. CLIENT-TRAINER ASSIGNMENTS
  // ─────────────────────────────────────────
  // Normal user assigned to gym trainer
  await prisma.clientTrainer.create({
    data: {
      clientId: normalUser.id,
      trainerId: gymTrainer.id,
      gymId: gym.id,
    },
  });

  // Kavitha assigned to freelance trainer
  await prisma.clientTrainer.create({
    data: {
      clientId: freelanceClient.id,
      trainerId: freelanceTrainer.id,
    },
  });

  // ─────────────────────────────────────────
  // 8. SAMPLE AI PLAN FOR NORMAL USER
  // ─────────────────────────────────────────
  const samplePlan = {
    dailyPlan: {
      day1: {
        diet: {
          breakfast: { meal: 'Oatmeal with fruits and nuts', calories: 380, protein: 18, carbs: 55, fat: 10 },
          lunch: { meal: 'Brown rice, dal, sabzi, salad', calories: 550, protein: 25, carbs: 80, fat: 12 },
          dinner: { meal: 'Chapati (2) with paneer curry and cucumber raita', calories: 450, protein: 22, carbs: 50, fat: 15 },
          snacks: [
            { item: 'Banana + almond milk', calories: 180, protein: 5 },
            { item: 'Roasted chana', calories: 120, protein: 7 },
          ],
        },
        workout: [
          { exercise: 'Brisk Walking', duration: '30 min', sets: null, reps: null, youtubeLink: 'https://youtu.be/srQCYGKEPRc', notes: 'Low impact, good for hypertension' },
          { exercise: 'Wall Push-ups', duration: null, sets: 3, reps: 12, youtubeLink: 'https://youtu.be/c_RWKZOI_FY', notes: 'Avoid knee strain' },
          { exercise: 'Chair Squats', duration: null, sets: 3, reps: 10, youtubeLink: 'https://youtu.be/IViGi0p7gAE', notes: 'Modified for knee pain' },
        ],
        yoga: [
          { pose: 'Surya Namaskar', duration: '10 min', notes: 'Slow pace, focus on breathing' },
          { pose: 'Virabhadrasana I (Warrior I)', duration: '5 min', notes: 'Gentle variation' },
          { pose: 'Savasana', duration: '10 min', notes: 'Complete relaxation' },
        ],
      },
    },
    generalNotes: 'Avoid high-impact exercises due to knee pain. Keep blood pressure in check—monitor daily. Vegetarian diet plan focused on high protein. Stay hydrated with 3L water daily.',
    estimatedCalories: 1680,
    estimatedCaloriesBurned: 350,
  };

  await prisma.aIPlan.create({
    data: {
      userId: normalUser.id,
      version: 1,
      durationDays: 7,
      generatedPlan: samplePlan,
      isManuallyEdited: false,
      isActive: true,
      age: 28,
      gender: 'male',
      height: 170,
      weight: 75,
      bmi: 25.95,
      activityLevel: 'moderately_active',
      medicalConditions: ['hypertension', 'knee pain'],
      goals: ['weight loss', 'improve stamina'],
      preferences: ['vegetarian'],
      estimatedCalories: 1680,
      generalNotes: 'Avoid high-impact exercises due to knee pain.',
    },
  });

  // ─────────────────────────────────────────
  // 9. SAMPLE PROGRESS LOG
  // ─────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const progressLog = await prisma.progressLog.create({
    data: {
      userId: normalUser.id,
      date: today,
      weight: 74.8,
      bmi: 25.9,
      streak: 3,
      notes: 'Felt energetic today. Completed all workouts.',
    },
  });

  await prisma.dietLog.create({
    data: {
      progressLogId: progressLog.id,
      breakfast: 'Oatmeal with banana',
      lunch: 'Brown rice with dal',
      dinner: 'Chapati with paneer',
      snacks: 'Roasted chana',
      totalCalories: 1650,
      totalProtein: 72,
      waterIntake: 3.0,
    },
  });

  await prisma.workoutLog.create({
    data: {
      progressLogId: progressLog.id,
      exercise: 'Brisk Walking',
      durationMinutes: 30,
      caloriesBurned: 180,
      isCompleted: true,
    },
  });

  await prisma.yogaLog.create({
    data: {
      progressLogId: progressLog.id,
      pose: 'Surya Namaskar',
      durationMinutes: 10,
      isCompleted: true,
    },
  });

  // ─────────────────────────────────────────
  // 10. TRAINER NOTE
  // ─────────────────────────────────────────
  await prisma.trainerNote.create({
    data: {
      trainerId: gymTrainer.id,
      clientId: normalUser.id,
      note: 'Santhakumar is progressing well. Knee pain has reduced significantly. Suggested increasing walking to 45 minutes from next week.',
    },
  });

  // ─────────────────────────────────────────
  // 11. WELCOME NOTIFICATION
  // ─────────────────────────────────────────
  await prisma.notification.create({
    data: {
      userId: normalUser.id,
      type: 'welcome',
      title: 'Welcome to FitAI Hub! 🎉',
      body: 'Your 30-day free trial has started. Your personalized AI plan is ready!',
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\nTest Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Gym Owner:       owner@fitaihub.com     / FitAI@2026');
  console.log('Gym Trainer:     trainer@fitaihub.com   / FitAI@2026');
  console.log('Freelancer:      freelancer@fitaihub.com / FitAI@2026');
  console.log('Normal User:     user@fitaihub.com      / FitAI@2026');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
