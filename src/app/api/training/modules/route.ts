import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { createModule, findManyModules } from "@feature/training/services";
import { CreateTrainingModuleSchema } from "@feature/training/validators/training";
import { hasHighRoleAccess } from "@src/shared/utils/hasHighRole";

export const GET = withAssociation(
  {},
  async (association, _, request) => {
    const user = await withRole(request, UserRole.MEMBER);
    
    // Admins see all, members see only active ones and those required for their role
    const isActive = hasHighRoleAccess(user.role) ? undefined : true;
    const role = hasHighRoleAccess(user.role) ? undefined : user.role;

    const modules = await findManyModules({
      associationId: association.id,
      isActive,
      role,
    });

    return SuccessResponse({ data: modules });
  },
);

export const POST = withAssociation(
  { body: CreateTrainingModuleSchema },
  async (association, { body }, request) => {
    if (!body) {
      throw new ForbiddenError("Invalid request body");
    }

    const userId = request.headers.get("x-user-id")!;
    const user = await withRole(request, UserRole.DPO); // DPO or higher

    const module = await createModule({
      associationId: association.id,
      actorId: userId,
      data: body,
    });

    return SuccessResponse({ data: module }, 201);
  },
);
