import { NextResponse } from "next/server";
import { withAssociation } from "@src/shared/api/with-association";
import { requireAuth } from "@src/shared/api/auth";
import { ConsentService } from "@src/features/consent";
import { ForbiddenError } from "@src/shared/errors";

/**
 * GET /api/consent/report
 * 
 * Retrieves the consent report for the association.
 * Roles: DPO, PRESIDENT, SUPER_ADMIN
 */
export const GET = withAssociation(
  {},
  async (association) => {
    const auth = await requireAuth();
    
    // Role check according to PRD section 3.7
    const allowedRoles = ["DPO", "PRESIDENT", "SUPER_ADMIN"];
    if (!allowedRoles.includes(auth.role)) {
      throw new ForbiddenError("Insufficient permissions: DPO, PRESIDENT, or SUPER_ADMIN required");
    }
    
    const report = await ConsentService.getConsentReport(
      association.id
    );

    return NextResponse.json({
      data: report,
    });
  }
);
