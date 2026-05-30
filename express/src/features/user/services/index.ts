// Shared utilities
import { prisma } from '@src/shared/lib/prisma';
import { PAGE_SIZE } from '@src/shared/constants';

// ---- Prisma

import { Prisma } from '@prisma/client';

// ---------------------------------------------------------------------------
// User Service — Data Access Layer
//
// Provides CRUD wrappers around the Prisma-generated models for User and
// PaymentTransaction. Each function encapsulates the field selection so that
// callers (route handlers) do not need to know the underlying database schema
// and cannot accidentally leak sensitive fields.
// ---------------------------------------------------------------------------

// ---- Types

/** Properties required to update a single user record. */
type Props = {
  /** Unique Prisma identifier (id, email, etc.) for the user to update. */
  where: Prisma.UserWhereUniqueInput;
  /** Fields and values to update on the user record. */
  data: Prisma.UserUpdateInput;
};

// ---------------------------------------------------------------------------
// updateUser
//
// Persist profile changes to the user table. Returns a curated subset of
// fields so that sensitive or internal columns (e.g. passwordHash, role) are
// never leaked to the caller.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// getUser
//
// Retrieve a single user by any unique identifier (id, email, etc.). Returns
// a safe subset of fields including mfaEnabled so the caller can determine
// whether multi-factor authentication is required before proceeding.
// ---------------------------------------------------------------------------

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

// ---- Types

/** Properties for fetching a paginated list of a user's payment transactions. */
type GetUserInvoicesProps = {
  /** Prisma filter criteria to scope the invoice query (e.g. by user or association). */
  where: Prisma.PaymentTransactionWhereInput;
  /** Page number for pagination — defaults to 1 if omitted. */
  page?: number;
};

// ---------------------------------------------------------------------------
// getUserInvoices
//
// Fetch a paginated list of payment transactions (invoices) matching the
// given filter. Runs both the data query and the count query inside a single
// Prisma $transaction to guarantee read consistency. Returns a tuple of
// [data: PaymentTransaction[], total: number].
// ---------------------------------------------------------------------------

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

// ---- Types

/** Properties for fetching a single payment transaction by unique identifier. */
type GetUserInvoiceProps = {
  /** Unique Prisma identifier for the payment transaction to retrieve. */
  where: Prisma.PaymentTransactionWhereUniqueInput;
};

// ---------------------------------------------------------------------------
// getUserInvoice
//
// Retrieve a single invoice by its ID, eagerly loading the associated
// association, user details (name, email, membership number, designation),
// and allocation periods. Returns null when no matching transaction is found.
// ---------------------------------------------------------------------------

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

// ---- Types

/** Properties for querying multiple users with an optional Prisma filter. */
type GetUsersProps = {
  /** Prisma filter criteria to scope which users are returned. */
  where: Prisma.UserWhereInput;
};

// ---------------------------------------------------------------------------
// getUsers
//
// Retrieve all users matching the provided filter. Intended for admin or
// search use-cases where a list of users is needed rather than a single one.
// ---------------------------------------------------------------------------

export async function getUsers(props: GetUsersProps) {
  return await prisma.user.findMany(props);
}
