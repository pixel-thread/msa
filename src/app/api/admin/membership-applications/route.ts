import { UserRole } from "@prisma/client";
import { getMembershipApplications } from "@src/features/membership-applications/services";
import { GetMembershipApplicationsQuerySchema } from "@src/features/membership-applications/validators";
import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils";

export const GET = withAssociation(
  { query: GetMembershipApplicationsQuerySchema },
  async (_association, { query }, req) => {
    await withRole(req, UserRole.SECRETARY);

    const status = query?.status;
    const page = query?.page || 1;

    const where = status ? { status } : {};

    const result = await getMembershipApplications({
      where,
      page,
    });

    return SuccessResponse({ data: result.data, meta: result.pagination });
  },
);
