import { withAssociation, withRole } from "@src/shared/api";
import { ConsentService } from "@src/features/consent";
import { SuccessResponse } from "@src/shared/utils";
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

    const { records, total } = await ConsentService.getAllConsentRecords(
      association.id,
      query,
    );

    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 20;

    return SuccessResponse({
      data: records,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total,
      },
    });
  },
);
