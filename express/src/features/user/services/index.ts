import { Prisma } from '@prisma/client';
import { PAGE_SIZE } from '@src/shared/constants';
import { prisma } from '@src/shared/lib/prisma';

/** Props for updating a user. */
type Props = {
  /** The unique identifier of the user to update. */
  where: Prisma.UserWhereUniqueInput;
  /** The data to update. */
  data: Prisma.UserUpdateInput;
};

/** Update a user's profile in the database. */
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

/** Fetch a single user by unique identifier. */
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

/** Props for listing user invoices with pagination. */
type GetUserInvoicesProps = {
  /** Filter criteria for finding payment transactions. */
  where: Prisma.PaymentTransactionWhereInput;
  /** Page number (defaults to 1). */
  page?: number;
};

/** Fetch a paginated list of invoices for a user. Returns the invoices and total count. */
export async function getUserInvoices({ where, page = 1 }: GetUserInvoicesProps) {
  return await prisma.$transaction([
    prisma.paymentTransaction.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),

    prisma.paymentTransaction.count({
      where,
    }),
  ]);
}

/** Props for fetching a single user invoice. */
type GetUserInvoiceProps = {
  /** Unique identifier for the payment transaction. */
  where: Prisma.PaymentTransactionWhereUniqueInput;
};

/** Fetch a single invoice by unique identifier, including association, user, and allocation details. */
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

/** Props for fetching multiple users. */
type GetUsersProps = {
  /** Filter criteria for finding users. */
  where: Prisma.UserWhereInput;
};

/** Fetch multiple users matching the given criteria. */
export async function getUsers(props: GetUsersProps) {
  return await prisma.user.findMany(props);
}
