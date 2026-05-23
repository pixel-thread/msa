import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";

export const GET = withAssociation({}, async (association, _, request, { params }) => {
  await withRole(request, UserRole.FINANCE);

  const { memberId } = (await params) as { memberId: string };

  const memberLedger = await prisma.ledgerEntry.findMany({
    where: {
      createdById: memberId,
    },
    include: {
      lines: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return SuccessResponse({ data: memberLedger });
});
