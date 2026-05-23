import { withAssociation } from "@src/shared/api";
import { SuccessResponse } from "@src/shared/utils";
import { BadRequestError, NotFoundError, UnauthorizedError } from "@src/shared/errors";
import { prisma } from "@src/shared/lib/prisma";
import { ComplaintParamsSchema } from "@src/features/compliance/validators";

export const GET = withAssociation(
  { params: ComplaintParamsSchema },
  async (association, { params }, req) => {
    if (!params) throw new BadRequestError("Invalid complaint ID");

    const userId = req.headers.get("x-user-id");
    if (!userId) throw new UnauthorizedError("Unauthorized");

    const complaint = await prisma.complaint.findFirst({
      where: {
        id: params.complaintId,
        associationId: association.id,
        userId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!complaint) throw new NotFoundError("Complaint not found");

    return SuccessResponse({ data: complaint });
  },
);
