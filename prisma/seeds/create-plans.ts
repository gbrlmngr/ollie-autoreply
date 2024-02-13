import { PrismaClient } from '@prisma/client';
import { customAlphabet } from 'nanoid';
import { lowercase, numbers } from 'nanoid-dictionary';

const prisma = new PrismaClient();
const nanoid = customAlphabet(`${lowercase}${numbers}`);

async function run() {
  await prisma.plans.createMany({
    data: [
      {
        id: `pln_${nanoid(21)}`,
        code: 'FREE_PLAN',
        name: 'Free plan',
        features: { maximumInboxes: 10, inboxCapacity: 5 },
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
