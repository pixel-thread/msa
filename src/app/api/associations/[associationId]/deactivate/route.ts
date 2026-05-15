import { UserRole } from "@prisma/client";
import { findUniqueAssociation } from "@src/features/associations/services/findUniqueAssociation";
import { updateAssociation } from "@src/features/associations/services/updateAssociation";
import { withValidation } from "@src/shared/api";
import { withRole } from "@src/shared/api/with-role";
import { UnauthorizedError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";
import z from "zod";

const ParamsSchema = z.object({
  associationId: z.string().cuid(),
});

export const POST = withValidation({ params: ParamsSchema }, async (req, _ctx, { params }) => {
  await withRole(req, UserRole.SUPER_ADMIN);

  const userId = req.headers.get("x-user-id");

  if (!userId) {
    throw new UnauthorizedError("Unauthorized");
  }

  const isAssociationExist = await findUniqueAssociation({
    where: { id: params?.associationId },
  });

  if (!isAssociationExist) {
    throw new Error("Association not found");
  }

  const updatedAssociation = await updateAssociation({
    where: { id: params?.associationId },
    data: { isActive: false },
  });

  return SuccessResponse({
    data: updatedAssociation,
    message: "Association deactivated successfully",
  });
});
