// ---- External libs ----
import { UserRole } from '@prisma/client';

// ---- Shared utilities ----
import { prisma } from '@lib/prisma';
import { PAGE_SIZE } from '@src/shared/constants';
import { buildPagination } from '@src/shared/utils/build-pagination';

// ---- Interfaces ----

/** Parameters for finding training modules. */
interface FindManyModulesProps {
  associationId: string;
  role?: UserRole[];
  isActive?: boolean;
  page?: number;
  userId?: string;
}

// ---- Service ----

/**
 * Retrieve paginated training modules with optional role/active filters and user completion status.
 *
 * Business intent: Members see only modules matching their role with no completion;
 * managers/DPOs see all modules regardless of role.
 */
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
