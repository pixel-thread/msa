import { withValidation, withRole } from "@src/shared/api";
import { createAssociation } from "@src/features/associations/services/createAssociation";
import { findManyAssociation } from "@src/features/associations/services/findManyAssociation";
import { findFirstAssociation } from "@src/features/associations/services/findFirstAssociation";
import { SuccessResponse } from "@src/shared/utils";
import { UserRole, type Association } from "@prisma/client";
import { ConflictError } from "@src/shared/errors";
import type { CreateAssociationInput } from "@validator/associations";
import { CreateAssociationSchema } from "@src/shared/validators";

export const GET = withValidation({}, async (req) => {
  await withRole(req, UserRole.SUPER_ADMIN);

  const associations = await findManyAssociation({
    orderBy: { createdAt: "desc" },
    where: { status: "ACTIVE" },
  });

  return SuccessResponse<Association[]>({ data: associations });
});

export const POST = withValidation(
  { body: CreateAssociationSchema },
  async (req, _ctx, { body }) => {
    await withRole(req, UserRole.SUPER_ADMIN);

    const existing = await findFirstAssociation({
      where: {
        OR: [
          { slug: body?.slug, status: "ACTIVE" },
          { name: body?.name, status: "ACTIVE" },
        ],
      },
      take: 1,
    });

    if (existing) {
      throw new ConflictError("Association Already Exists");
    }

    const association = await createAssociation({
      data: body as CreateAssociationInput,
    });

    return SuccessResponse<Association>(
      {
        data: association,
        message: "Association created successfully",
      },
      201,
    );
  },
);
