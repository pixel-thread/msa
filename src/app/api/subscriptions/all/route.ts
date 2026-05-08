import { auth } from "@clerk/nextjs/server";

import { prisma } from "@src/shared/lib/prisma";
import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse, ErrorResponse } from "@src/shared/utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { getAllPayments } from "@feature/subscription/services";

const ADMIN_ROLES = ["SECRETARY", "PRESIDENT", "SUPER_ADMIN", "FINANCE"];

export const GET = withAssociation(
  { query: null },
  async (association) => {
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponse("Authentication required", 401);
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || !ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenError("Only admins can view all payments");
    }

    const result = await getAllPayments(association);
    return SuccessResponse({ data: result });
  },
);