import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { requireAuth } from "@src/shared/api/auth";
import { verifyPassword } from "@src/shared/lib/password";

const disableMfaSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type DisableMfaBody = z.infer<typeof disableMfaSchema>;

export const POST = withValidation(
  { body: disableMfaSchema },
  async (_, _ctx, { body }) => {
    const { userId } = await requireAuth();

    const { password } = body as DisableMfaBody;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, mfaEnabled: true },
    });

    if (!user || !user.mfaEnabled) {
      return NextResponse.json(
        { success: false, message: "MFA is not enabled" },
        { status: 400 },
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { success: false, message: "Please set a password first" },
        { status: 400 },
      );
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 401 },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false },
    });

    return NextResponse.json({
      success: true,
      message: "MFA disabled successfully",
      data: {
        mfaEnabled: false,
      },
    });
  },
);

