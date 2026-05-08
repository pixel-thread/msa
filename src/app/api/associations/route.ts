import { SuccessResponse } from "@src/shared/utils/responses";
import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";

export const GET = withValidation({}, async () => {
  const associations = await prisma.association.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  return SuccessResponse({ data: associations });
});

