import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";
import { z } from "zod";
import { ValidationError } from "@src/shared/errors";

const CreateAccountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
});

export const GET = withAssociation({}, async (association, _, request) => {
  await withRole(request, UserRole.FINANCE);

  const accounts = await prisma.account.findMany({
    where: {
      associationId: association.id,
      isActive: true,
    },
    orderBy: {
      code: "asc",
    },
  });

  return SuccessResponse({ data: accounts });
});

export const POST = withAssociation(
  { body: CreateAccountSchema },
  async (association, { body }, request) => {
    await withRole(request, UserRole.FINANCE);

    if (!body) {
      throw new ValidationError("Invalid request body");
    }

    const account = await prisma.account.create({
      data: {
        ...body,
        associationId: association.id,
      },
    });

    return SuccessResponse({ data: account }, 201);
  }
);
