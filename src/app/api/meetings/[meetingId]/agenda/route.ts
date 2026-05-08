import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { processAgendaOperations } from "@feature/meetings/services/processAgendaOperations";
import { AgendaOperationSchema } from "@feature/meetings/validators/agenda-items";
import { z } from "zod";

const ParamsSchema = z.object({ 
  meetingId: z.string().uuid("Invalid meeting ID") 
});

export const PATCH = withAssociation(
  { params: ParamsSchema, body: AgendaOperationSchema },
  async (association, { params, body }, request) => {
    // Check for administrative roles (Secretary and above)
    await withRole(request, UserRole.SECRETARY);
    
    // params and body are guaranteed to be defined because of withAssociation/withValidation
    const items = await processAgendaOperations({
      meetingId: params!.meetingId,
      associationId: association.id,
      operations: body!.operations
    });

    return SuccessResponse({ 
      data: items,
      message: "Agenda updated successfully"
    });
  }
);
