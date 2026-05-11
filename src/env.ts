import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    UPSTASH_REDIS_REST_URL: z.url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    FIELD_ENCRYPTION_KEY: z.string().length(64),
    CRON_SECRET: z.string().min(32),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    RESEND_API_KEY: z.string().startsWith("re_").optional(),
    NODE_ENV: z.enum(["development", "test", "production"]),

    // Razorpay
    RAZORPAY_KEY_ID: z.string().min(1),
    RAZORPAY_KEY_SECRET: z.string().min(1),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
    ALLOWED_ORIGINS: z
      .array(z.url())
      .transform((origins) => origins.join(","))
      .default("http://localhost:3000")
      .optional(),

    // JWT Configuration
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
    REFRESH_TOKEN_EXPIRY: z.string().default("7d"),
    OTP_EXPIRY: z.string().default("5m"),
    OTP_LENGTH: z.number().default(6),
    OTP_MAX_ATTEMPTS: z.number().default(3),
    OTP_RESEND_COOLDOWN: z.number().default(60),

    // Password reset
    PASSWORD_RESET_TOKEN_EXPIRY: z.string().default("1h"),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_ASSOCIATION_SLUG: z.string().min(2).max(10),
    NEXT_PUBLIC_API_BASE_URL: z.url().default("http://localhost:3000/api"),
    NEXT_PUBLIC_ACCESS_TOKEN_EXPIRY: z.number().default(900),
  },
  runtimeEnv: {
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

    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY,
    OTP_EXPIRY: process.env.OTP_EXPIRY,
    OTP_LENGTH: process.env.OTP_LENGTH ? parseInt(process.env.OTP_LENGTH) : 6,
    OTP_MAX_ATTEMPTS: process.env.OTP_MAX_ATTEMPTS
      ? parseInt(process.env.OTP_MAX_ATTEMPTS)
      : 3,
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
