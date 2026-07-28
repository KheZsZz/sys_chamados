import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { isAppError } from '@/libs/errors';

export function errorHandler(
  error: FastifyError | ZodError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {

  if (isAppError(error)) {
    return reply.status(error.statusCode).send({ message: error.message });
  }


  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Validation error.',
      issues: error.flatten().fieldErrors,
    });
  }


  const fastifyError = error as FastifyError;
  if (fastifyError.validation) {
    return reply.status(400).send({
      message: 'Validation error.',
      issues: fastifyError.validation,
    });
  }

  const statusCode = fastifyError.statusCode ?? 500;

  if (statusCode >= 500) {
    request.log.error(error);
    return reply.status(500).send({ message: 'Internal server error.' });
  }

  return reply.status(statusCode).send({ message: error.message });
}
