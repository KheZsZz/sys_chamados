import 'fastify';
import { ROLE_HIERARCHY, ROLE_DEPARTAMENT } from '@/config/roles';

declare module 'fastify' {
  interface FastifyRequest {
    user: {
      id: string;
      orgId: string;
      email: string;
      role: keyof typeof ROLE_HIERARCHY;
      department: keyof typeof ROLE_DEPARTAMENT;
    };
  }
}
