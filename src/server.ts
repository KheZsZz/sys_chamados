import "dotenv/config"
import Fastify from "fastify";
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookies from '@fastify/cookie';
import multipart from '@fastify/multipart';

export const app = Fastify();

app.register(jwt, {
  secret: process.env.JWT_SECRET || 'fallback-secret',
});

app.register(cookies, {
  secret: process.env.COOKIE_SECRET,
});

app.register(cors, {
  origin: process.env.CORS_ORIGINS,
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

app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    console.error(err);
  }
  console.log(`Server listening at ${address}`);
});
