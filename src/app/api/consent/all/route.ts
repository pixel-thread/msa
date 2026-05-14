import { NextResponse } from "next/server";
import { withAssociation } from "@src/shared/api/with-association";
import { requireAuth, requireRole } from "@src/shared/api/auth";
import { ConsentService } from "@src/features/consent";
import { ForbiddenError } from "@src/shared/errors";

/**
 * GET /api/consent/all
 * 
 * Retrieves all consent records in the association.
 * Roles: DPO, SUPER_ADMIN
 */
export const GET = withAssociation(
  {},
  async (association) => {
    const auth = await requireAuth();
    
    // Strict role check according to PRD matrix
    if (auth.role !== "DPO" && auth.role !== "SUPER_ADMIN") {
      throw new ForbiddenError("Insufficient permissions: DPO or SUPER_ADMIN required");
    }
    
    const records = await ConsentService.getAllConsentRecords(
      association.id
    );

    return NextResponse.json({
      data: records,
    });
  }
);
