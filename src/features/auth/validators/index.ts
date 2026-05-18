import { passwordValidation } from "@src/shared/lib/validations/auth";
import z from "zod";

export const SignUpSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof SignUpSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: passwordValidation,
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const SignInSchema = z.object({
  email: z.email("Invalid email address"),
  password: passwordValidation,
});

export type SignInInput = z.infer<typeof SignInSchema>;

export const VerifySignInSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
  mfa_temp_token: z.string().optional(),
});

export type VerifySignInInput = z.infer<typeof VerifySignInSchema>;

export const RefreshTokenSchema = z.object({
  token: z.string().optional(),
});

export const SignOutSchema = z.object({
  token: z.string(),
});

export const ForgotPasswordSchema = z.object({
  email: z.email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
