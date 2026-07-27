import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  PORT: z.coerce.number().int().default(3333),
  JWT_SECRET: z.string().min(16),
  COOKIE_SECRET: z.string().min(16),
  CORS_ORIGINS: z.string().default('*'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  IMAGEKIT_PUBLIC_KEY: z.string().min(1, 'IMAGEKIT_PUBLIC_KEY is required'),
  IMAGEKIT_PRIVATE_KEY: z.string().min(1, 'IMAGEKIT_PRIVATE_KEY is required'),
  IMAGEKIT_URL_ENDPOINT: z.string().url('IMAGEKIT_URL_ENDPOINT must be a valid URL'),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  // Accepts either "email@domain.com" or "Display Name <email@domain.com>",
  // so no strict .email() validation here.
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required'),
  // Shared secret required in the `x-cron-secret` header to call /cron/* routes.
  CRON_SECRET: z.string().min(16, 'CRON_SECRET must be at least 16 characters'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
