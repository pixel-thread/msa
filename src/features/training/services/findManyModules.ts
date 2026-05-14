import { prisma } from "@lib/prisma";
import { UserRole } from "@prisma/client";

interface FindManyModulesProps {
  associationId: string;
  role?: UserRole[];
  isActive?: boolean;
}

export async function findManyModules({ associationId, role, isActive }: FindManyModulesProps) {
  return await prisma.trainingModule.findMany({
    where: {
      associationId,
      isActive,
      ...(role ? { requiredForRoles: { hasSome: role } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}
