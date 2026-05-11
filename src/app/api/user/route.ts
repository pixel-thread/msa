import { UserRole } from "@prisma/client";
import { withValidation } from "@src/shared/api";
import { withRole } from "@src/shared/api/with-role";
import { UnauthorizedError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { SuccessResponse } from "@src/shared/utils";
import z from "zod";

const UpdateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.coerce.number().min(10).max(10),
  designation: z.string(),
  dateOfJoiningGovt: z.coerce.date(),
  dateOfJoiningMfsa: z.coerce.date,
});

export const POST = withValidation({ body: UpdateUserSchema }, async (req) => {
  await withRole(req, UserRole.MEMBER);

  const userId = req.headers.get("x-user-id");

  const user = await prisma.user.findUnique({
    where: { id: userId as string },
  });

  if (!user) throw new UnauthorizedError("User not found");
  // TODO: Update user details
  return SuccessResponse({ data: null });
});
