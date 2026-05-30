// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------

import { pageNumberValidation, uuidValidiation } from '@src/shared/validators/common';

// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------

import z from 'zod';

// ---------------------------------------------------------------------------
// Ledger validators
//
// Schemas for ledger route params, query strings, and request bodies.
// ---------------------------------------------------------------------------

/** Schema for ledger route parameters containing a member ID. */
export const LedgerRouteParams = z.object({ memberId: uuidValidiation });

/** Schema for paginated ledger query parameters. */
export const LedgerQueryParams = z.object({
  page: pageNumberValidation,
});

/** Schema for a single ledger entry line (debit/credit). */
export const CreateLedgerLineSchema = z.object({
  accountId: z.string().uuid(),
  isDebit: z.boolean(),
  amount: z.number().positive(),
});

/** Schema for creating a new ledger entry with multiple lines. */
export const CreateLedgerEntrySchema = z.object({
  description: z.string().min(1),
  paymentId: z.string().uuid().optional().nullable(),
  lines: z.array(CreateLedgerLineSchema).min(2),
});
