import z from "zod";

export const UpdateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z
    .string()
    .min(10)
    .max(10)
    .regex(/^[0-9]+$/, "Should contain only number"),
  designation: z.string(),
  dateOfJoiningGovt: z.coerce.date(),
  dateOfJoiningMfsa: z.coerce.date(),
});
