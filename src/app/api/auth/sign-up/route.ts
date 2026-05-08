import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@src/shared/lib/prisma";
import { withValidation } from "@src/shared/api";
import { hashPassword, validatePasswordStrength } from "@src/shared/lib/password";
import { signAccessToken, signRefreshToken } from "@src/shared/lib/jwt";
import { sendWelcomeEmail } from "@src/shared/lib/email";
import { hashToken } from "@src/shared/lib/password";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  associationId: z.string().uuid("Invalid association ID").optional(),
});

type SignUpBody = z.infer<typeof signUpSchema>;

export const POST = withValidation(
  { body: signUpSchema },
  async (_, { body }) => {
    const { email, password, name, associationId } = body as SignUpBody;
    
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.errors[0], errors: passwordValidation.errors },
        { status: 400 },
      );
    }

    let targetAssociationId = associationId;
    
    if (!targetAssociationId) {
      const defaultAssociation = await prisma.association.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      
      if (!defaultAssociation) {
        return NextResponse.json(
          { success: false, message: "No active association found" },
          { status: 400 },
        );
      }
      
      targetAssociationId = defaultAssociation.id;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        associationId: targetAssociationId,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User already exists with this email" },
        { status: 409 },
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        associationId: targetAssociationId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        associationId: true,
      },
    });

    const accessToken = await signAccessToken(user.id, user.email, user.role);
    const refreshToken = await signRefreshToken(user.id);
    const hashedRefreshToken = hashToken(refreshToken);
    
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedRefreshToken,
        expiresAt: refreshTokenExpiry,
      },
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      },
      { status: 201 },
    );

    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60,
      path: "/",
    });

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    await sendWelcomeEmail(user.email, user.name);

    return response;
  }
);