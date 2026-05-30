import { passwordValidation } from '@validator/auth';
import z from 'zod';

export const SignUpSchema = z
  .object({
    email: z.email('Invalid email address'),
    associationSlug: z.string().optional(),
    firstName: z.string().min(3, 'First name must be at least 3 characters'),
    lastName: z.string().min(3, 'Last name must be at least 3 characters'),
    dateOfBirth: z.string('Invalid date of birth'),
    age: z
      .number('age must be a number')
      .positive('age must be a positive number')
      .gte(18, 'Age must be greater than 18'),
    // gender: z.enum(["MALE", "FEMALE", "OTHER"], "Invalid gender"),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional(),
  })
  .refine((val) => !Boolean(val.lastName === val.firstName), {
    message: 'First name and last name cannot be the same',
  })
  .refine(
    (data) => {
      const today = new Date();
      const dob = new Date(data.dateOfBirth);

      // 1. Calculate the rough difference in years
      let age = today.getFullYear() - dob.getFullYear();

      // 2. Adjust if the birthday hasn't happened yet this year
      const monthDiff = today.getMonth() - dob.getMonth();
      const dayDiff = today.getDate() - dob.getDate();

      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }

      // Return true if age is 18 or older
      return age >= 18 || data.age !== age;
    },
    {
      message: 'You must be at least 18 years old to sign up.',
      path: ['dateOfBirth'], // Attaches the error directly to the dateOfBirth field
    },
  )
  .strict();

export type SignUpInput = z.infer<typeof SignUpSchema>;

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: passwordValidation,
  })
  .strict();

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const SignInSchema = z
  .object({
    email: z.email('Invalid email address'),
    password: passwordValidation,
  })
  .strict();

export type SignInInput = z.infer<typeof SignInSchema>;

export const VerifySignInSchema = z
  .object({
    code: z.string().length(6, 'Code must be 6 digits'),
    mfa_temp_token: z.string().optional(),
  })
  .strict();

export type VerifySignInInput = z.infer<typeof VerifySignInSchema>;

export const RefreshTokenSchema = z
  .object({
    token: z.string().optional(),
  })
  .strict();

export const SignOutSchema = z
  .object({
    token: z.string().optional(),
  })
  .strict();

export const ForgotPasswordSchema = z
  .object({
    email: z.email('Invalid email address'),
  })
  .strict();

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: passwordValidation,
    newPassword: passwordValidation,
    confirmPassword: passwordValidation,
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .strict();

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
