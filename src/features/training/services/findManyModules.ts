import 'server-only';
import { prisma } from '@lib/prisma';
import { UserRole } from '@prisma/client';
import { PAGE_SIZE } from '@src/shared/constants';
import { buildPagination } from '@src/shared/utils/build-pagination';

interface FindManyModulesProps {
  associationId: string;
  role?: UserRole[];
  isActive?: boolean;
  page?: number;
  userId?: string;
}

export async function findManyModules({
  associationId,
  role,
  isActive,
  page = 1,
  userId,
}: FindManyModulesProps) {
  const [trainingModules, total] = await prisma.$transaction([
    prisma.trainingModule.findMany({
      where: {
        associationId,
        isActive,
        ...(role
          ? {
              requiredForRoles: { hasSome: role },
              completions: { none: { userId } },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: { completions: true },
    }),

    prisma.trainingModule.count({
      where: {
        associationId,
        isActive,
        ...(role ? { requiredForRoles: { hasSome: role } } : {}),
      },
    }),
  ]);

  return {
    trainingModules,
    pagination: buildPagination(total, page, PAGE_SIZE),
  };
}
