import { UserRole } from "@prisma/client";
import { findUniqueAssociation } from "@src/features/associations/services/findUniqueAssociation";
import { updateAssociation } from "@src/features/associations/services/updateAssociation";
import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { UnauthorizedError } from "@src/shared/errors";
import { SuccessResponse } from "@src/shared/utils";

export const POST = withAssociation({}, async (association, {}, req) => {
  await withRole(req, UserRole.SUPER_ADMIN);

  const userId = req.headers.get("x-user-id");

  if (!userId) {
    throw new UnauthorizedError("Unauthorized");
  }

  const isAssociationExist = await findUniqueAssociation({
    where: { id: association.id },
  });

  if (!isAssociationExist) {
    throw new Error("Association not found");
  }

  const updatedAssociation = await updateAssociation({
    where: { id: association.id },
    data: { isActive: false },
  });

  return SuccessResponse({
    data: updatedAssociation,
    message: "Association deactivated successfully",
  });
});
