import { pageNumberValidation, uuidValidiation } from '@src/shared/validators/common';
import z from 'zod';

export const LedgerRouteParams = z.object({ memberId: uuidValidiation });

export const LedgerQueryParams = z.object({
  page: pageNumberValidation,
});

export const CreateLedgerLineSchema = z.object({
  debitAccountId: z.string(),
  amount: z.number(),
});

export const CreateLedgerEntrySchema = z.object({
  description: z.string(),
  paymentId: z.string().optional(),
  lines: z.array(CreateLedgerLineSchema),
});
