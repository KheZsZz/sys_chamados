import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@/generated/prisma';
import { env } from '@/schemas/env.schema';

const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query', 'warn', 'error'],
});
