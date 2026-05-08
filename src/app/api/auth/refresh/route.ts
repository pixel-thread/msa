import { NextResponse } from "next/server";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { verifyRefreshToken, signAccessToken, signRefreshToken } from "@src/shared/lib/jwt";
import { hashToken } from "@src/shared/lib/password";

export const POST = withValidation({}, async (request) => {
  const refreshCookie = request.cookies.get("refresh_token");
  
  if (!refreshCookie?.value) {
    return NextResponse.json(
      { success: false, message: "Refresh token not found" },
      { status: 401 },
    );
  }

  let payload;
  try {
    payload = await verifyRefreshToken(refreshCookie.value);
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid or expired refresh token" },
      { status: 401 },
    );
  }

  const hashedToken = hashToken(refreshCookie.value);
  
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: hashedToken },
    include: { user: true },
  });

  if (!storedToken || storedToken.revokedAt) {
    return NextResponse.json(
      { success: false, message: "Token has been revoked" },
      { status: 401 },
    );
  }

  if (storedToken.expiresAt < new Date()) {
    return NextResponse.json(
      { success: false, message: "Refresh token has expired" },
      { status: 401 },
    );
  }

  const user = storedToken.user;
  
  if (user.status !== "ACTIVE") {
    return NextResponse.json(
      { success: false, message: "User is not active" },
      { status: 401 },
    );
  }

  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revokedAt: new Date() },
  });

  const newAccessToken = await signAccessToken(user.id, user.email, user.role);
  const newRefreshToken = await signRefreshToken(user.id);
  const hashedNewRefreshToken = hashToken(newRefreshToken);
  
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: hashedNewRefreshToken,
      expiresAt: refreshTokenExpiry,
    },
  });

  const response = NextResponse.json({
    success: true,
    message: "Token refreshed successfully",
  });

  response.cookies.set("access_token", newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60,
    path: "/",
  });

  response.cookies.set("refresh_token", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
});