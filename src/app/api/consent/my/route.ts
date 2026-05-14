import { NextResponse } from "next/server";
import { withAssociation } from "@src/shared/api/with-association";
import { requireAuth } from "@src/shared/api/auth";
import { ConsentService } from "@src/features/consent";

/**
 * GET /api/consent/my
 * 
 * Retrieves the current consent state for the authenticated user.
 */
export const GET = withAssociation(
  {},
  async (association) => {
    const auth = await requireAuth();
    
    const consentState = await ConsentService.getUserConsentState(
      auth.userId,
      association.id
    );

    return NextResponse.json({
      data: consentState,
      association: association.slug,
    });
  }
);
