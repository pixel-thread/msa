import { UserRole } from "@prisma/client";
import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils";

export const GET = withAssociation({}, async (association, _, req) => {
  withRole(req, UserRole.MEMBER);
  return SuccessResponse({ data: association });
});
