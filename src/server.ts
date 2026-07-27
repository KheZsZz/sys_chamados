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
import { usersRoutes } from '@/routes/users.router';
import { categoriesRoutes } from '@/routes/categories.router';
import { slaRoutes } from '@/routes/sla.router';
import { ticketsRoutes } from '@/routes/tickets.router';
import { commentsRoutes } from '@/routes/comments.router';
import { attachmentsRoutes } from '@/routes/attachments.router';
import { notificationsRoutes } from '@/routes/notifications.router';
import { cronRoutes } from '@/routes/cron.router';
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
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
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
app.register(usersRoutes, { prefix: '/users' });
app.register(categoriesRoutes, { prefix: '/categories' });
app.register(slaRoutes, { prefix: '/sla-policies' });
app.register(ticketsRoutes, { prefix: '/tickets' });
app.register(commentsRoutes, { prefix: '/tickets' });
app.register(attachmentsRoutes, { prefix: '/tickets' });
app.register(notificationsRoutes, { prefix: '/notifications' });
app.register(cronRoutes, { prefix: '/cron' });

app.listen({ port: env.PORT, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
