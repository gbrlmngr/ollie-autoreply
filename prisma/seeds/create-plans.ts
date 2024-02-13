import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  await prisma.plans.createMany({
    data: [
      {
        id: 'FREE',
        name: 'Free plan',
        features: {
          maximumNumberOfInboxes: 10,
          useUnlimitedInboxes: false,
          maximumInboxCapacity: 3,
        },
      },
    ],
    skipDuplicates: true,
  });
}

run()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
