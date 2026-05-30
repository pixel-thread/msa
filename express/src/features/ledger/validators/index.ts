import { pageNumberValidation, uuidValidiation } from '@src/shared/validators/common';
import z from 'zod';

export const LedgerRouteParams = z.object({ memberId: uuidValidiation });

export const LedgerQueryParams = z.object({
  page: pageNumberValidation,
});

export const CreateLedgerLineSchema = z.object({
  accountId: z.string().uuid(),
  isDebit: z.boolean(),
  amount: z.number().positive(),
});

export const CreateLedgerEntrySchema = z.object({
  description: z.string().min(1),
  paymentId: z.string().uuid().optional().nullable(),
  lines: z.array(CreateLedgerLineSchema).min(2),
});

