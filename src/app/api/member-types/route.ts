import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { BadRequestError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import {
  createMemberType,
  findManyMemberTypes,
} from "@feature/member-type/services";
import { CreateMemberTypeSchema } from "@feature/member-type/validators";

export const GET = withAssociation({}, async (association, _, request) => {
  await withRole(request, UserRole.MEMBER);

  const memberTypes = await findManyMemberTypes({
    associationId: association.id,
  });

  return SuccessResponse({ data: memberTypes });
});

export const POST = withAssociation(
  { body: CreateMemberTypeSchema },
  async (association, { body }, request) => {
    if (!body) {
      throw new BadRequestError("Invalid request body");
    }

    const user = await withRole(request, UserRole.PRESIDENT);

    const memberType = await createMemberType({
      associationId: association.id,
      actorId: user.id,
      data: body,
    });

    return SuccessResponse({ data: memberType }, 201);
  },
);

