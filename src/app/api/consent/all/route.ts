import { withAssociation, withRole } from "@src/shared/api";
import { ConsentService } from "@src/features/consent";
import { buildPagination, SuccessResponse } from "@src/shared/utils";
import { UserRole } from "@prisma/client";
import { AllConsentRecordsQuerySchema } from "@src/features/consent/validators/consent.validators";

/**
 * GET /api/consent/all
 *
 * Retrieves all consent records in the association with pagination and filtering.
 * Roles: DPO, SUPER_ADMIN
 */
export const GET = withAssociation(
  { query: AllConsentRecordsQuerySchema },
  async (association, { query }, req) => {
    await withRole(req, UserRole.DPO);

    const page = query?.page ?? 1;
    const { records, total } = await ConsentService.getAllConsentRecords(
      association.id,
      query,
    );

    return SuccessResponse({
      data: records,
      meta: buildPagination(total, page),
    });
  },
);
