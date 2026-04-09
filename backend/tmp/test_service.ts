import { generateAIPlan } from '../src/services/ai.service';
import { prisma } from '../src/config/db';

async function test() {
  try {
    // Get a real user ID
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found in DB');

    console.log(`Testing AI generation for user: ${user.id}`);
    
    const result = await generateAIPlan(user.id, {
      age: 24,
      gender: 'male',
      height: 178,
      weight: 90,
      activityLevel: 'moderately_active',
      medicalConditions: [],
      goals: [],
      preferences: [],
      durationDays: 7,
    });
    
    console.log('Success!', result);
  } catch (err: any) {
    console.error('CRASHED WITH ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
