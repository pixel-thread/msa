import { withAssociation } from "@src/shared/api/with-association";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UnauthorizedError, ValidationError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";

const OnboardingSchema = z.object({
  dateOfJoiningGovt: z.string().datetime().refine((d) => new Date(d) < new Date(), "Cannot be in the future"),
  dateOfJoiningMfsa: z.string().datetime().refine((d) => new Date(d) < new Date(), "Cannot be in the future"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Valid Indian mobile number required"),
  designation: z.string().min(2).max(100).trim(),
});

export const POST = withAssociation(
  { body: OnboardingSchema },
  async (association, { body }, request) => {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      throw new UnauthorizedError("Unauthorized");
    }

    if (!body) {
      throw new ValidationError("Invalid request body");
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
        associationId: association.id,
      },
      data: {
        dateOfJoiningGovt: new Date(body.dateOfJoiningGovt),
        dateOfJoiningMfsa: new Date(body.dateOfJoiningMfsa),
        mobile: body.mobile,
        designation: body.designation,
      },
    });

    return SuccessResponse({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        designation: user.designation,
        mobile: user.mobile,
        dateOfJoiningGovt: user.dateOfJoiningGovt,
        dateOfJoiningMfsa: user.dateOfJoiningMfsa,
      },
      message: "Onboarding completed successfully",
    });
  }
);
