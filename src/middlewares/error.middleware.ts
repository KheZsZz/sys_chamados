import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { isAppError } from '@/libs/errors';

export function errorHandler(
  error: FastifyError | ZodError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Known, expected application errors (thrown intentionally by services/routes)
  if (isAppError(error)) {
    return reply.status(error.statusCode).send({ message: error.message });
  }

  // Zod validation errors thrown manually (e.g. schema.parse inside a service)
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Validation error.',
      issues: error.flatten().fieldErrors,
    });
  }

  // Validation errors coming from @fastify/type-provider-zod on route schemas
  const fastifyError = error as FastifyError;
  if (fastifyError.validation) {
    return reply.status(400).send({
      message: 'Validation error.',
      issues: fastifyError.validation,
    });
  }

  const statusCode = fastifyError.statusCode ?? 500;

  // Anything unexpected: log full details internally, never leak them to the client
  if (statusCode >= 500) {
    request.log.error(error);
    return reply.status(500).send({ message: 'Internal server error.' });
  }

  return reply.status(statusCode).send({ message: error.message });
}
