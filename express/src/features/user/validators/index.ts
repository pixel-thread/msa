// External libs
import z from 'zod';

// ---- Prisma

import { $Enums, UserRole } from '@prisma/client';

// ---- Shared utilities

import { uuidValidiation } from '@src/shared/validators/common';

// ---------------------------------------------------------------------------
// User Validators
//
// Zod schemas for validating request bodies, query parameters, and route
// parameters for user-facing endpoints (both self-service and admin).
// ---------------------------------------------------------------------------

// ---- Profile (self-service)

/** Schema for updating the authenticated user's own profile fields. */
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

// ---- Admin: Get user

/** Query parameters for listing / filtering users from the admin panel. */
export const AdminGetUserQuerySchema = z.object({
  status: z.enum($Enums.UserStatus, 'Invalid User status').default('ACTIVE').optional(),
});

/** Route parameters for fetching a specific user by ID (admin). */
export const AdminGetUserParamsSchema = z.object({
  userId: uuidValidiation,
});

// ---- Admin: Approve user

/** Route parameters for approving a user registration (admin). */
export const AdminUserApproveParamsSchema = z.object({
  userId: uuidValidiation,
});

/** Request body for approving a user — requires member type, optional role + dates. */
export const AdminUserApproveSchema = z
  .object({
    memberTypeId: z.uuid('Invalid member type'),
    role: z.enum(UserRole, 'Invalid role').default('MEMBER').optional(),
    dateOfJoiningGovt: z.coerce.date('Invalid date').default(new Date()).optional(),
  })
  .strict();
