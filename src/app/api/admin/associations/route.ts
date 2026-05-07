import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { Prisma } from "@prisma/client";
import { withValidation } from "@src/shared/api";
import { CreateAssociationSchema } from "@src/shared/lib/validations";
import { createAssociation } from "@src/features/associations/services/createAssociation";
import { withAuth } from "@src/shared/middleware";

type SessionClaims = { org_role?: string; metadata?: { role?: string } };

export async function GET() {
  try {
    const associations = await prisma.association.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(associations);
  } catch (error) {
    console.error("Fetch associations error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export const POST = withValidation(
  { body: CreateAssociationSchema },
  async (req, ctx, body) => {
    const userId = req.headers.get("x-user-id");
    // check for user and his role
    const association = await createAssociation({
      data: body,
    });

    return NextResponse.json(
      { data: association, message: "Association created successfully" },
      { status: 201 },
    );
  },
);
