import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils";
import { BadRequestError, NotFoundError } from "@src/shared/errors";
import { UserRole, Prisma } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { ComplianceCheckParamsSchema } from "@src/features/compliance/validators";

export const GET = withAssociation(
  { params: ComplianceCheckParamsSchema },
  async (association, { params }, request) => {
    await withRole(request, UserRole.DPO);
    if (!params) throw new BadRequestError("Invalid check ID");

    const check = await prisma.complianceCheck.findFirst({
      where: { id: params.checkId, associationId: association.id },
    });

    if (!check) throw new NotFoundError("Compliance check not found");

    return SuccessResponse({ data: check });
  },
);

export const DELETE = withAssociation(
  { params: ComplianceCheckParamsSchema },
  async (association, { params }, request) => {
    await withRole(request, UserRole.DPO);
    if (!params) throw new BadRequestError("Invalid check ID");

    const existing = await prisma.complianceCheck.findFirst({
      where: { id: params.checkId, associationId: association.id },
    });

    if (!existing) throw new NotFoundError("Compliance check not found");

    await prisma.complianceCheck.delete({
      where: { id: params.checkId },
    });

    return SuccessResponse({
      data: null,
      message: "Compliance check deleted successfully",
    });
  },
);
