import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const gyms = await prisma.gym.findMany({
    include: {
      owner: { select: { id: true, name: true, email: true } }
    }
  });
  console.log('Gyms in DB:', JSON.stringify(gyms, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
