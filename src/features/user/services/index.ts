import { Prisma } from "@prisma/client";
import { prisma } from "@src/shared/lib/prisma";

type Props = {
  where: Prisma.UserWhereUniqueInput;
  data: Prisma.UserUpdateInput;
};
export async function updateUser({ where, data }: Props) {
  return await prisma.user.update({
    where,
    data,
    select: {
      id: true,
      name: true,
      mobile: true,
      email: true,
      designation: true,
      dateOfJoiningGovt: true,
      dateOfJoiningAssociation: true,
    },
  });
}

export async function getUser(where: Prisma.UserWhereUniqueInput) {
  return await prisma.user.findUnique({
    where,
    select: {
      id: true,
      name: true,
      mobile: true,
      email: true,
      designation: true,
      dateOfJoiningGovt: true,
      dateOfJoiningAssociation: true,
      mfaEnabled: true,
    },
  });
}

type GetUserInvoicesProps = {
  where: Prisma.PaymentTransactionWhereInput;
};

export async function getUserInvoices({ where }: GetUserInvoicesProps) {
  return await prisma.paymentTransaction.findMany({
    where,
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
      allocations: { include: { contributionPeriod: true } },
    },
  });
}

type GetUserInvoiceProps = {
  where: Prisma.PaymentTransactionWhereUniqueInput;
};

export async function getUserInvoice({ where }: GetUserInvoiceProps) {
  return await prisma.paymentTransaction.findUnique({
    where,
    include: {
      association: true,
      user: {
        select: {
          name: true,
          email: true,
          membershipNumber: true,
          designation: true,
        },
      },
      allocations: { include: { contributionPeriod: true } },
    },
  });
}

type GetUsersProps = {
  where: Prisma.UserWhereInput;
};

export async function getUsers(props: GetUsersProps) {
  return await prisma.user.findMany(props);
}
