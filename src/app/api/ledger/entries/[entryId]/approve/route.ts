import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole, ApprovalStatus } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";

export const POST = withAssociation({}, async (association, _, request, { params }) => {
  await withRole(request, UserRole.PRESIDENT);
  const userId = request.headers.get("x-user-id")!;

  const { entryId } = (await params) as { entryId: string };

  const entry = await prisma.ledgerEntry.update({
    where: { id: entryId },
    data: {
      approvalStatus: ApprovalStatus.APPROVED,
      approvedById: userId,
      approvedAt: new Date(),
    },
  });

  return SuccessResponse({ data: entry });
});
