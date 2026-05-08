import { NextResponse } from "next/server";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { hashToken } from "@src/shared/lib/password";

export const POST = withValidation({}, async (request) => {
  const refreshCookie = request.cookies.get("refresh_token");
  
  if (refreshCookie?.value) {
    const hashedToken = hashToken(refreshCookie.value);
    
    await prisma.refreshToken.updateMany({
      where: { token: hashedToken },
      data: { revokedAt: new Date() },
    });
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  return response;
});