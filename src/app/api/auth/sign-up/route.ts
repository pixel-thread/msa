import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { ConflictError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import { env } from "@src/env";
import {
  MembershipApplicationInput,
  MembershipApplicationSchema,
} from "@src/features/membership-applications/validators";
import { createMembershipApplication } from "@src/features/membership-applications/services";
import { logger } from "@src/shared/logger/server";

export const POST = withValidation(
  { body: MembershipApplicationSchema },
  async (_req, _ctx, { body, traceId }) => {
    logger.info({
      traceId,
      email: body?.email,
    }, "POST /api/auth/sign-up - Request started");
    const {
      email,
      phone,
      associationSlug,
      firstName,
      lastName,
      dateOfBirth,
      age,
      gender,
      address,
      city,
      state,
      country,
      postalCode,
    } = body as MembershipApplicationInput;

    const [association, user] = await Promise.all([
      prisma.association.findFirst({
        where: { slug: associationSlug || env.NEXT_PUBLIC_ASSOCIATION_SLUG },
        select: { id: true, name: true },
      }),

      prisma.user.findFirst({
        where: { email },
        select: { id: true, status: true },
      }),
    ]);

    if (!association) {
      logger.error({
        traceId,
        associationSlug,
      }, "POST /api/auth/sign-up - Association not found");
      throw new ConflictError("Association not found");
    }

    if (user && user.status === "ACTIVE") {
      logger.error(
        "POST /api/auth/sign-up - Active User already exists with this email",
        { traceId, email },
      );
      throw new ConflictError("An Active User already exist with this email");
    }

    const application = await createMembershipApplication({
      email,
      phone,
      associationSlug: associationSlug || env.NEXT_PUBLIC_ASSOCIATION_SLUG,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      age,
      gender,
      address,
      city,
      state,
      country,
      postalCode,
    });

    logger.info({
      traceId,
      applicationId: application.id,
    }, "POST /api/auth/sign-up - Success");

    return SuccessResponse(
      {
        message:
          "Application submitted successfully. Your membership request is pending approval.",
        data: {
          id: application.id,
          email: application.email,
          status: application.status,
          createdAt: application.createdAt,
        },
      },
      201,
    );
  },
);
