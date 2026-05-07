import { z } from "zod";

export const OnboardingSchema = z.object({
  dateOfJoiningGovt: z
    .string()
    .datetime()
    .refine((d) => new Date(d) < new Date(), "Cannot be in the future"),
  dateOfJoiningMfsa: z
    .string()
    .datetime()
    .refine((d) => new Date(d) < new Date(), "Cannot be in the future"),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Valid Indian mobile number required"),
  designation: z.string().min(2).max(100).trim(),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;