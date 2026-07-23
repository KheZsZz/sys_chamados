import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  PORT: z.coerce.number().int().default(3333),
  JWT_SECRET: z.string().min(16),
  COOKIE_SECRET: z.string().min(16),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:', parsed.error.flatten().fieldErrors);
  throw new Error('Configuração de ambiente inválida');
}

export const env = parsed.data;
