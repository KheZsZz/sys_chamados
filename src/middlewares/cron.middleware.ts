import { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '@/schemas/env.schema';

/**
 * Protects internal endpoints meant to be triggered by an external scheduler
 * (Vercel Cron, Neon cron, a system crontab hitting the API, etc.) instead of
 * by a logged-in user. Compares a shared secret sent in a header against
 * CRON_SECRET — there is no JWT here because the caller is infrastructure,
 * not a user session.
 */
export async function cronAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const secret = request.headers['x-cron-secret'];

  if (!secret || secret !== env.CRON_SECRET) {
    return reply.status(401).send({ message: 'Invalid or missing cron secret.' });
  }
}
