import { $Enums, UserRole } from '@prisma/client';
import { uuidValidiation } from '@src/shared/validators/common';
import z from 'zod';

/** Schema for updating user profile fields. */
export const UpdateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z
    .string()
    .min(10)
    .max(10)
    .regex(/^[0-9]+$/, 'Should contain only number'),
  designation: z.string(),
  dateOfJoiningGovt: z.coerce.date(),
  dateOfJoiningAssociation: z.coerce.date(),
});

/** Schema for admin get-user query parameters. */
export const AdminGetUserQuerySchema = z.object({
  status: z.enum($Enums.UserStatus, 'Invalid User status').default('ACTIVE').optional(),
});

/** Schema for admin get-user route parameters. */
export const AdminGetUserParamsSchema = z.object({
  userId: uuidValidiation,
});

/** Schema for admin approve-user route parameters. */
export const AdminUserApproveParamsSchema = z.object({
  userId: uuidValidiation,
});

/** Schema for approving a user — specifies member type, role, and dates. */
export const AdminUserApproveSchema = z
  .object({
    memberTypeId: z.uuid('Invalid member type'),
    role: z.enum(UserRole, 'Invalid role').default('MEMBER').optional(),
    dateOfJoiningGovt: z.coerce.date('Invalid date').default(new Date()).optional(),
  })
  .strict();
