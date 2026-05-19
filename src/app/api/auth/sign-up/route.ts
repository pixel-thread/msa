import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import {
  hashPassword,
  validatePasswordStrength,
} from "@src/shared/lib/password";
import { sendWelcomeEmail } from "@src/shared/lib/email";
import {
  BadRequestError,
  ConflictError,
  ValidationError,
} from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import { env } from "@src/env";
import { SignUpInput, SignUpSchema } from "@src/features/auth/validators";

export const POST = withValidation(
  { body: SignUpSchema },
  async (_req, _ctx, { body }) => {
    const { email, password, name, association_slug } = body as SignUpInput;

    const passwordValidation = validatePasswordStrength(password);

    if (!passwordValidation.valid) {
      throw new ValidationError(passwordValidation.errors[0]);
    }

    const targetAssociationSlug = association_slug;
    let targetAssociationId: string | null = null;

    if (!targetAssociationId) {
      const defaultAssociation = await prisma.association.findFirst({
        where: {
          slug: targetAssociationSlug || env.NEXT_PUBLIC_ASSOCIATION_SLUG,
        },
        select: { id: true },
      });

      if (!defaultAssociation) {
        throw new BadRequestError("No active associations found");
      }

      targetAssociationId = defaultAssociation.id;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        associationId: targetAssociationId,
      },
      include: {
        association: true,
      },
    });

    if (existingUser) {
      throw new ConflictError(
        `This email is already under ${existingUser.association.name}. Please use another email`,
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        associationId: targetAssociationId,
        role: ["MEMBER"],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        associationId: true,
      },
    });

    const response = SuccessResponse(
      {
        message: "Account created Successfully, waiting for approval",
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      201,
    );

    if (env.NODE_ENV === "production") {
      await sendWelcomeEmail(user.email, user.name);
    }

    return response;
  },
);
