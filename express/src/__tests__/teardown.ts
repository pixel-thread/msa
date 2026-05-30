import { prisma } from '@src/shared/lib';

afterAll(async () => {
  await prisma.$disconnect();
});
