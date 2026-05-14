import { withAssociation } from "@src/shared/api/with-association";
import { UserRole } from "@prisma/client";
import { generateComplianceEvidence } from "@src/features/complaince/services";
import { withRole } from "@src/shared/api/with-role";
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

