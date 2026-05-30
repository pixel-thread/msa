import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().url(),
  BASE_URL: z.url(),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  STORAGE_PROVIDER: z.enum(['sftp', 'supabase']).default('sftp'),
  STORAGE_BUCKET: z.string().default('public'),

  SUPABASE_SECRET_KEY: z.string(),
  SUPABASE_URL: z.string().url(),

  SFTP_HOST: z.string(),
  SFTP_USERNAME: z.string().default('sftp_user'),
  SFTP_PASSWORD: z.string(),
  SFTP_PORT: z.coerce.number().default(22),
  SFTP_TIMEOUT: z.coerce.number().default(10000),
  SFTP_ROOT: z.string().default('/'),

  FIELD_ENCRYPTION_KEY: z.string().min(32),
  CRON_SECRET: z.string().min(1),

  RESEND_API_KEY: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_PASSWORD_RESET_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().default('http://localhost:4000'),
  JWT_AUDIENCE: z.string().default('http://localhost:4000'),
  ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
  OTP_EXPIRY: z.string().default('5m'),
  OTP_LENGTH: z.coerce.number().default(6),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(3),
  OTP_RESEND_COOLDOWN: z.coerce.number().default(60),
  PASSWORD_RESET_TOKEN_EXPIRY: z.string().default('1h'),

  NEXT_PUBLIC_ASSOCIATION_SLUG: z.string().min(2).max(10).default('mfsa'),
  NEXT_PUBLIC_NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
