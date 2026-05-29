import z from 'zod';

export const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(100, 'Password cannot exceed 100 characters')
  // Individual checks for specific feedback
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');
