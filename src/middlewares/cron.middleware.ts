import { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '@/schemas/env.schema';


export async function cronAuthMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const secret = request.headers['x-cron-secret'];

  if (!secret || secret !== env.CRON_SECRET) {
    return reply.status(401).send({ message: 'Invalid or missing cron secret.' });
  }
}
