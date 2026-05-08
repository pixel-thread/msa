import { requireAuth } from "@src/shared/api/auth";
import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse, ErrorResponse } from "@src/shared/utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { getAllPayments } from "@feature/subscription/services";

const ADMIN_ROLES = ["SECRETARY", "PRESIDENT", "SUPER_ADMIN", "FINANCE"];

export const GET = withAssociation(
  {},
  async (association) => {
    const { userId, role } = await requireAuth();

    if (!ADMIN_ROLES.includes(role)) {
      throw new ForbiddenError("Only admins can view all payments");
    }

    const result = await getAllPayments(association, userId);
    return SuccessResponse({ data: result });
  },
);