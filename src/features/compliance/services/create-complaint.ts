import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { AuditAction, ComplaintCategory } from '@prisma/client';
import type { ComplianceSubmitFormData } from '@src/features/compliance/validators';

export async function createComplaint({
  associationId,
  userId,
  data,
}: {
  associationId: string;
  userId: string;
  data: ComplianceSubmitFormData;
}) {
  return await prisma.$transaction(async (tx) => {
    const complaint = await tx.complaint.create({
      data: {
        associationId,
        userId,
        category: data.category as ComplaintCategory,
        subject: data.subject,
        description: data.description,
        priority: data.priority,
      },
    });

    await tx.auditLog.create({
      data: {
        associationId,
        actorId: userId,
        action: AuditAction.COMPLAINT_CREATE,
        resourceType: 'Complaint',
        resourceId: complaint.id,
        newValues: complaint as any,
      },
    });

    return complaint;
  });
}
