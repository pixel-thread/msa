import { z } from "zod";
import { ConsentPurpose, ConsentStatus } from "@prisma/client";

/**
 * Validator for granting or revoking consent.
 */
export const ConsentUpdateSchema = z.object({
  purposes: z
    .array(
      z.nativeEnum(ConsentPurpose)
    )
    .min(1, "At least one purpose is required"),
  action: z.nativeEnum(ConsentStatus),
  channel: z.enum(["web", "mobile", "email"]).default("web"),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Type derived from ConsentUpdateSchema.
 */
export type ConsentUpdateInput = z.infer<typeof ConsentUpdateSchema>;

/**
 * Validator for consent report query parameters.
 */
export const ConsentReportQuerySchema = z.object({
  purpose: z.nativeEnum(ConsentPurpose).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/**
 * Type derived from ConsentReportQuerySchema.
 */
export type ConsentReportQueryInput = z.infer<typeof ConsentReportQuerySchema>;
