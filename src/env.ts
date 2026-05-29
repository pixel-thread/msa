import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    UPSTASH_REDIS_REST_URL: z.url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    // storage
    STORAGE_PROVIDER: z.enum(['sftp', 'supabase']).default('sftp'),
    STORAGE_BUCKET: z.string('SUPABASE_BUCKET').default('public'),
    // Supabase
    SUPABASE_SECRET_KEY: z.string('SUPABASE_KEY'),
    SUPABASE_URL: z.url('SUPABASE_URL'),
    //SFTP

    SFTP_HOST: z.string(),
    SFTP_USERNAME: z.string().default('sftp_user'),
    SFTP_PASSWORD: z.string(),
    SFTP_PORT: z.coerce.number().default(22),
    SFTP_TIMEOUT: z.coerce.number().default(10000),
    SFTP_ROOT: z.string().default('/'),

    FIELD_ENCRYPTION_KEY: z
      .string()
      .regex(/^[0-9a-fA-F]{64}$/, 'FIELD_ENCRYPTION_KEY must be a 32-byte hex key'),
    CRON_SECRET: z.string().min(32),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    RESEND_API_KEY: z.string().startsWith('re_').optional(),
    NODE_ENV: z.enum(['development', 'test', 'production']),

    // Razorpay (optional - use database providers instead)
    RAZORPAY_KEY_ID: z.string().min(1).optional(),
    RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),
    ALLOWED_ORIGINS: z
      .array(z.url())
      .transform((origins) => origins.join(','))
      .default('http://localhost:3000')
      .optional(),

    // JWT Configuration
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_PASSWORD_RESET_SECRET: z.string().min(32),
    JWT_ISSUER: z.string().default('https://mfsa.netlify.app'),
    JWT_AUDIENCE: z.string().default('https://mfsa.netlify.app'),
    ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
    REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
    OTP_EXPIRY: z.string().default('5m'),
    OTP_LENGTH: z.number().default(6),
    OTP_MAX_ATTEMPTS: z.number().default(3),
    OTP_RESEND_COOLDOWN: z.number().default(60),

    // Password reset
    PASSWORD_RESET_TOKEN_EXPIRY: z.string().default('1h'),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_ASSOCIATION_SLUG: z.string().min(2).max(10),
    NEXT_PUBLIC_API_BASE_URL: z.url(),
    NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY: z.number().default(900),
    NEXT_PUBLIC_NODE_ENV: z.enum(['development', 'test', 'production']),
  },
  runtimeEnv: {
    SFTP_HOST: process.env.SFTP_HOST,
    SFTP_USERNAME: process.env.SFTP_USERNAME,
    SFTP_PASSWORD: process.env.SFTP_PASSWORD,
    SFTP_PORT: process.env.SFTP_PORT ? parseInt(process.env.SFTP_PORT) : 22,
    SFTP_TIMEOUT: process.env.SFTP_TIMEOUT ? parseInt(process.env.SFTP_TIMEOUT) : 10000,
    SFTP_ROOT: process.env.SFTP_ROOT,
    STORAGE_BUCKET: process.env.STORAGE_BUCKET,
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    DATABASE_URL: process.env.DATABASE_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    FIELD_ENCRYPTION_KEY: process.env.FIELD_ENCRYPTION_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ASSOCIATION_SLUG: process.env.NEXT_PUBLIC_ASSOCIATION_SLUG,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,

    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_PASSWORD_RESET_SECRET: process.env.JWT_PASSWORD_RESET_SECRET,
    JWT_ISSUER: process.env.JWT_ISSUER,
    JWT_AUDIENCE: process.env.JWT_AUDIENCE,
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY,
    OTP_EXPIRY: process.env.OTP_EXPIRY,
    OTP_LENGTH: process.env.OTP_LENGTH ? parseInt(process.env.OTP_LENGTH) : 6,
    OTP_MAX_ATTEMPTS: process.env.OTP_MAX_ATTEMPTS ? parseInt(process.env.OTP_MAX_ATTEMPTS) : 3,
    OTP_RESEND_COOLDOWN: process.env.OTP_RESEND_COOLDOWN
      ? parseInt(process.env.OTP_RESEND_COOLDOWN)
      : 60,
    PASSWORD_RESET_TOKEN_EXPIRY: process.env.PASSWORD_RESET_TOKEN_EXPIRY,
    NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY: process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY
      ? parseInt(process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY)
      : 900,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
