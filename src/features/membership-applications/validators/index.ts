import { $Enums, UserRole } from '@prisma/client';
import {
  pageNumberValidation,
  pageSizeValidation,
  uuidValidiation,
} from '@src/shared/validators/common';
import z from 'zod';

const associationsSlug = ['mfsa', 'mpsa', 'mpsc'];

export const MembershipApplicationSchema = z
  .object({
    email: z.email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    associationSlug: z.enum(associationsSlug, 'Invalid association'),
    firstName: z.string().min(3, 'First name must be at least 3 characters'),
    lastName: z.string().min(3, 'Last name must be at least 3 characters'),
    dateOfBirth: z.coerce.date('Invalid date of birth').transform((val) => new Date(val)),
    age: z
      .number('Age must be a number')
      .positive('Age must be a positive number')
      .gte(18, 'Age must be greater than 18'),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER'], 'Invalid gender'),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  })
  .refine((val) => val.lastName !== val.firstName, {
    message: 'First name and last name cannot be the same',
  })
  .refine(
    (data) => {
      const today = new Date();
      const dob = new Date(data.dateOfBirth);
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      const dayDiff = today.getDate() - dob.getDate();
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }
      return age >= 18 || data.age !== age;
    },
    {
      message: 'You must be at least 18 years old to sign up.',
      path: ['dateOfBirth'],
    },
  )
  .strict();

export type MembershipApplicationInput = z.infer<typeof MembershipApplicationSchema>;

export const GetMembershipApplicationsQuerySchema = z.object({
  status: z.enum($Enums.ApplicationStatus, 'Invalid application status').optional(),
  page: pageNumberValidation,
  pageSize: pageSizeValidation,
});

export type GetMembershipApplicationsQuery = z.infer<typeof GetMembershipApplicationsQuerySchema>;

export const MembershipApplicationParamsSchema = z.object({
  applicationId: uuidValidiation,
});

export const ApproveApplicationSchema = z
  .object({
    memberTypeId: z.uuid('Invalid member type'),
    role: z.enum(UserRole, 'Invalid role').default('MEMBER').optional(),
    dateOfJoiningGovt: z.coerce.date('Invalid date').default(new Date()).optional(),
  })
  .strict();

export type ApproveApplicationInput = z.infer<typeof ApproveApplicationSchema>;

export const RejectApplicationSchema = z
  .object({
    rejectionReason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
  })
  .strict();

export type RejectApplicationInput = z.infer<typeof RejectApplicationSchema>;
