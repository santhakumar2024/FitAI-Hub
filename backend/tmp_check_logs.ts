// tmp_check_logs.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
  const latestPlan = await prisma.aiPlan.findFirst({
    orderBy: { createdAt: 'desc' },
  });
  if (latestPlan) {
    fs.writeFileSync('plan_structure.json', JSON.stringify(latestPlan.generatedPlan, null, 2));
    console.log('Plan structure saved to plan_structure.json');
  } else {
    console.log('No plan found.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
