import { z } from 'zod';
import { DsarRequestType, DsarStatus } from '@prisma/client';
import { pageNumberValidation } from '@src/shared/validators/common';

export const SubmitDsarSchema = z.object({
  requestType: z.enum(DsarRequestType),
  requestedData: z.array(z.string()).min(1, 'At least one data category required'),
  description: z
    .string()
    .max(500)
    .optional()
    .transform((v) => v?.trim()),
});

export const RespondDsarSchema = z.object({
  status: z.enum(DsarStatus),
  notes: z.string().max(1000).optional(),
  rejectedReason: z.string().max(500).optional(),
  responseType: z.string().optional(),
  storageKey: z.string().optional(),
  deliveryMethod: z.string().default('secure_download'),
});

export const DsarQuerySchema = z.object({
  page: pageNumberValidation,
  status: z.enum(DsarStatus).optional(),
  requestType: z.enum(DsarRequestType).optional(),
  userId: z.string().optional(),
});
