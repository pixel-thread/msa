import { auth } from "@clerk/nextjs/server";

import { prisma } from "@src/shared/lib/prisma";
import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse, ErrorResponse } from "@src/shared/utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { getPlanByAssociation, createPlan } from "@feature/subscription/services";
import { CreatePlanSchema } from "@feature/subscription/validators/subscription";

const ADMIN_ROLES = ["SECRETARY", "PRESIDENT", "SUPER_ADMIN"];

export const GET = withAssociation(
  { query: null as any },
  async (association) => {
    const plan = await getPlanByAssociation(association);

    if (!plan) {
      return SuccessResponse({ data: { plan: null }, message: "No membership plan configured" });
    }

    return SuccessResponse({ data: { plan } });
  },
);

export const POST = withAssociation(
  {
    body: CreatePlanSchema,
  },
  async (association, { body }) => {
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponse("Authentication required", 401);
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || !ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenError("Only admins can set membership plan");
    }

    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const { plan, isUpdated } = await createPlan(association, body);

    return SuccessResponse(
      { data: { plan }, message: isUpdated ? "Membership plan updated" : "Membership plan created" },
      isUpdated ? 200 : 201,
    );
  },
);