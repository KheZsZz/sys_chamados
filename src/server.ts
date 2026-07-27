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
import { errorHandler } from '@/middlewares/error.middleware';

export const app = Fastify().withTypeProvider<ZodTypeProvider>();

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(jwt, {
  secret: env.JWT_SECRET,
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
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
app.setErrorHandler(errorHandler);

app.register(authRoutes, { prefix: '/auth' });

app.listen({ port: env.PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
