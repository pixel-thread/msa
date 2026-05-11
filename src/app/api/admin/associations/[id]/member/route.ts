import { UserRole } from "@prisma/client";
import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { ConflictError, NotFoundError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { SuccessResponse } from "@src/shared/utils";
import { env } from "@src/env";
import { AddAssociationMemberSchema } from "@src/features/associations/validators/associations";

export const POST = withAssociation(
  { body: AddAssociationMemberSchema },
  async (_, { body }, req) => {
    withRole(req, UserRole.SUPER_ADMIN);

    const [user, association] = await Promise.all([
      prisma.user.findUnique({
        where: {
          id: body?.user_id as string,
        },
      }),

      prisma.association.findUnique({
        where: {
          id: body?.association_id as string,
        },
      }),
    ]);

    if (!user) throw new NotFoundError("User not found");

    if (!association) throw new NotFoundError("Association not found");
    if (body?.association_id === association.id)
      throw new ConflictError("User already under the target association");

    const updatedUser = await prisma.user.update({
      where: { id: body?.user_id as string },
      data: {
        association: { connect: { id: body?.association_id as string } },
      },
      select: {
        id: true,
        role: true,
        associationId: true,
        email: true,
        name: true,
      },
    });

    if (env.NODE_ENV === "production") {
      // TODO: Sent email for association change
      // Notify president of high role user that new user join the association
    }

    return SuccessResponse({
      data: updatedUser,
      message: "User association change successfully",
    });
  },
);
