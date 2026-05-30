import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

import { env } from '@src/env';

/** Creates a new Prisma client instance wired to a pg-pool adapter. */
const createPrisma = () => {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Singleton Prisma client (cached on globalThis in dev to avoid hot-reload leaks). */
export const prisma = globalForPrisma.prisma ?? createPrisma();

export type { PrismaClient };

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
