import "dotenv/config"
import Fastify from "fastify";
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookies from '@fastify/cookie';
import multipart from '@fastify/multipart';

import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from '@fastify/type-provider-zod';
import { env } from '@/schemas/env.schema';
import { authRoutes } from '@/routes/auth.router';

export const app = Fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);


app.register(jwt, {
  secret: process.env.JWT_SECRET || 'fallback-secret',
});
app.register(cookies, {
  secret: env.COOKIE_SECRET,
});
app.register(cors, {
  origin: env.CORS_ORIGINS,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});
app.register(rateLimit, {
  max: 100,
  timeWindow: "1m",
});
app.register(multipart, {
  limits: {
    fileSize: 2 * 1024 * 1024, // Limite de 2MB por arquivo
  },
});

app.register(authRoutes, { prefix: '/auth' });

app.setErrorHandler((error:any, _req, reply) => {
  app.log.error(error);
  const statusCode = error.statusCode ?? 500;
  return reply.status(statusCode).send({
    message: statusCode === 500 ? 'Erro interno do servidor.' : error.message,
  });
});
app.listen({ port: env.PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
