import 'fastify';
import { ROLE_HIERARCHY } from '@/config/roles';

declare module 'fastify' {
  interface FastifyRequest {
    companyId: string;
    user: {
      id: string;
      email: string;
      role: keyof typeof ROLE_HIERARCHY;
    };
  }
}
