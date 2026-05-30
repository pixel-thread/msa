import { pageNumberValidation } from '@src/shared/validators/common';
import { ComplaintStatus } from '@prisma/client';
import { z } from 'zod';

export const ComplaintQuerySchema = z.object({
  status: z.nativeEnum(ComplaintStatus).optional(),
  priority: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: pageNumberValidation,
});

export type ComplaintQueryInput = z.infer<typeof ComplaintQuerySchema>;

export const ComplaintParamsSchema = z.object({
  complaintId: z.string().uuid('Invalid complaint ID'),
});

export type ComplaintParamsInput = z.infer<typeof ComplaintParamsSchema>;

export const complianceSubmitSchema = z.object({
  category: z.enum([
    'MEETING_CONDUCT',
    'PAYMENT_DISPUTE',
    'DATA_PRIVACY',
    'MEMBER_CONDUCT',
    'ADMINISTRATIVE',
    'OTHER',
  ]),
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject cannot exceed 200 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
});

export type ComplianceSubmitFormData = z.output<typeof complianceSubmitSchema>;

export const CreateComplaintSchema = complianceSubmitSchema;
export type CreateComplaintInput = ComplianceSubmitFormData;
