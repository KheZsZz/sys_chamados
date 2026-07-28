import { ROLE_HIERARCHY, ROLE_DEPARTAMENT } from '@/libs/roles';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      id: string;
      orgId: string;
      email: string;
      role: keyof typeof ROLE_HIERARCHY;
      department: keyof typeof ROLE_DEPARTAMENT;
    };
    user: {
      id: string;
      orgId: string;
      email: string;
      role: keyof typeof ROLE_HIERARCHY;
      department: keyof typeof ROLE_DEPARTAMENT;
    };
  }
}
