import { PrismaClient } from '@/generated/prisma';
import { env } from '@/schemas/env.schema';

const prismaLogLevels =
  env.NODE_ENV === 'production'
    ? (['warn', 'error'] as const)
    : (['query', 'warn', 'error'] as const);

export const prisma = new PrismaClient({
  log: [...prismaLogLevels],
});
