import { prisma } from "@src/shared/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const userId = "21a042dd-5fac-4b7b-998d-8daedcdb700e";

  if (!userId) {
    throw new Error("User not found");
  }

  const getInvoice = await prisma.paymentTransaction.findMany({
    where: { userId: userId },
    include: {
      // The "Bill From" details
      association: true,
      // The "Bill To" details
      user: {
        select: {
          name: true,
          email: true,
          membershipNumber: true,
          designation: true,
        },
      },
      // The individual items being paid for
      allocations: {
        include: {
          contributionPeriod: true,
        },
      },
    },
  });
  return NextResponse.json({ data: getInvoice });
};
