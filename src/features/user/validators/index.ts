import { $Enums, UserRole } from "@prisma/client";
import { uuidValidiation } from "@src/shared/validators/common";
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

export const AdminGetUserQuerySchema = z.object({
  status: z
    .enum($Enums.UserStatus, "Invalid User status")
    .default("ACTIVE")
    .optional(),
});

export const AdminGetUserParamsSchema = z.object({
  userId: uuidValidiation,
});

export const AdminUserApproveParamsSchema = z.object({
  userId: uuidValidiation,
});

export const AdminUserApproveSchema = z.object({
  memberTypeId: uuidValidiation,
  role: z.enum(UserRole).default("MEMBER").optional(),
  dateOfJoiningGovt: z.coerce.date().default(new Date()).optional(),
  dateOfJoiningMfsa: z.coerce.date().default(new Date()).optional(),
  status: z.enum($Enums.UserStatus).default("ACTIVE").optional(),
});
