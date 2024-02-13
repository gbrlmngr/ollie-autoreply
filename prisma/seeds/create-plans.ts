import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  await prisma.plan.createMany({
    data: [
      {
        id: 'PLAN_FREE',
        name: 'Free plan',
        features: {
          inboxesQuota: 10,
          useUnlimitedInboxes: false,
          inboxCapacity: 5,
          useUnlimitedInboxCapacity: false,
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
