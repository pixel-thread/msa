import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { createModule, findManyModules } from "@feature/training/services";
import { CreateTrainingModuleSchema } from "@feature/training/validators/training";
import { hasHighRoleAccess } from "@src/shared/utils/has-high-role";

export const GET = withAssociation({}, async (association, _, request) => {
  const user = await withRole(request, UserRole.MEMBER);

  const isManager =
    hasHighRoleAccess(user.role) || user.role.includes(UserRole.DPO);
  const isActive = isManager ? undefined : true;
  const role = isManager ? undefined : user.role;

  if (hasHighRoleAccess(user.role)) {
    const modules = await findManyModules({
      associationId: association.id,
      isActive,
      role,
    });
    return SuccessResponse({
      data: modules.trainingModules,
      meta: modules.pagination,
    });
  }

  const modules = await findManyModules({
    associationId: association.id,
    userId: user.id,
    isActive,
    role,
  });

  return SuccessResponse({
    data: modules.trainingModules,
    meta: modules.pagination,
  });
});

export const POST = withAssociation(
  { body: CreateTrainingModuleSchema },
  async (association, { body }, request) => {
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const user = await withRole(request, UserRole.DPO); // DPO or higher

    const trainingModule = await createModule({
      associationId: association.id,
      actorId: user.id,
      data: body,
    });

    return SuccessResponse({ data: trainingModule }, 201);
  },
);
