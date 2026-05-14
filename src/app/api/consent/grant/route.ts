import { NextResponse } from "next/server";
import { withAssociation } from "@src/shared/api/with-association";
import { requireAuth } from "@src/shared/api/auth";
import { ConsentService, ConsentUpdateSchema } from "@src/features/consent";
import { ConsentStatus } from "@prisma/client";

/**
 * POST /api/consent/grant
 * 
 * Grants consent for specific purposes.
 */
export const POST = withAssociation(
  {
    body: ConsentUpdateSchema.omit({ action: true }),
  },
  async (association, { body }, request) => {
    const auth = await requireAuth();
    
    if (!body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const receipts = await ConsentService.updateConsent(
      auth.userId,
      association.id,
      {
        ...body,
        action: ConsentStatus.GRANTED,
      },
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      message: "Consent granted successfully",
      data: receipts,
    });
  }
);
