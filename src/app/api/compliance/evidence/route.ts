import { withAssociation, withRole } from "@src/shared/api";
import { UserRole } from "@prisma/client";
import { generateComplianceEvidence } from "@src/features/compliance/services";
import { SuccessResponse } from "@src/shared/utils";

export const GET = withAssociation(
  {},
  async (association, _validated, request) => {
    await withRole(request, UserRole.DPO);

    const evidence = await generateComplianceEvidence(association.id, 30);

    return SuccessResponse({
      data: evidence,
    });
  },
);

