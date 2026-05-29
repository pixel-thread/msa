import 'server-only';
import { AuditAction } from '@prisma/client';
import { NotFoundError } from '@src/shared/errors';
import { prisma } from '@src/shared/lib/prisma';
import { logAction } from '@src/shared/services/audit-logs';

export async function deleteModule(params: {
  associationId: string;
  moduleId: string;
  actorId: string;
}) {
  const { associationId, moduleId, actorId } = params;

  const existing = await prisma.trainingModule.findUnique({
    where: { id: moduleId, associationId },
  });

  if (!existing) {
    throw new NotFoundError('Training module not found');
  }

  await prisma.trainingModule.delete({
    where: { id: moduleId },
  });

  await logAction({
    actorId,
    action: AuditAction.DELETE,
    resourceType: 'TrainingModule',
    resourceId: moduleId,
    associationId,
  });

  return true;
}
