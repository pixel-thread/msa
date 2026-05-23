import {
  pageNumberValidation,
  pageSizeValidation,
} from "@src/shared/validators/common";
import { ComplaintStatus } from "@prisma/client";
import { z } from "zod";

export const ComplaintQuerySchema = z.object({
  status: z.nativeEnum(ComplaintStatus).optional(),
  priority: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: pageNumberValidation,
  limit: pageSizeValidation,
});

export type ComplaintQueryInput = z.infer<typeof ComplaintQuerySchema>;

export const ComplaintParamsSchema = z.object({
  complaintId: z.string().uuid("Invalid complaint ID"),
});

export type ComplaintParamsInput = z.infer<typeof ComplaintParamsSchema>;
