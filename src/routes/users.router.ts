import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { AccessMiddleware } from '@/middlewares/role.middleware';
import { ROLE_DEPARTAMENT } from '@/libs/roles';
import { usersService } from '@/services/users.service';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  userParamsSchema,
  listUsersQuerySchema,
} from '@/schemas/users.schema';

const ALL_DEPARTMENTS = Object.keys(ROLE_DEPARTAMENT);

export async function usersRoutes(routes: FastifyInstance) {
  const app = routes.withTypeProvider<ZodTypeProvider>();

  app.addHook('preHandler', authMiddleware);

  // Only ADMIN can create, update, delete or change another user's password.
  app.post('/', {
    preHandler: AccessMiddleware(ALL_DEPARTMENTS, 'ADMIN'),
    schema: { body: createUserSchema },
  }, async (req, res) => {
    const user = await usersService.create(req.user.orgId, req.body);
    return res.status(201).send(user);
  });

  app.get('/', {
    preHandler: AccessMiddleware(ALL_DEPARTMENTS, 'AGENT'),
    schema: { querystring: listUsersQuerySchema },
  }, async (req, res) => {
    const result = await usersService.list(req.user.orgId, req.query);
    return res.status(200).send(result);
  });

  app.get('/:id', {
    preHandler: AccessMiddleware(ALL_DEPARTMENTS, 'AGENT'),
    schema: { params: userParamsSchema },
  }, async (req, res) => {
    const user = await usersService.getById(req.user.orgId, req.params.id);
    return res.status(200).send(user);
  });

  app.put('/:id', {
    preHandler: AccessMiddleware(ALL_DEPARTMENTS, 'ADMIN'),
    schema: { params: userParamsSchema, body: updateUserSchema },
  }, async (req, res) => {
    const user = await usersService.update(req.user.orgId, req.params.id, req.body);
    return res.status(200).send(user);
  });

  app.patch('/:id/password', {
    preHandler: AccessMiddleware(ALL_DEPARTMENTS, 'ADMIN'),
    schema: { params: userParamsSchema, body: changePasswordSchema },
  }, async (req, res) => {
    await usersService.changePassword(req.user.orgId, req.params.id, req.body.password);
    return res.status(200).send({ message: 'Password updated successfully.' });
  });

  app.delete('/:id', {
    preHandler: AccessMiddleware(ALL_DEPARTMENTS, 'ADMIN'),
    schema: { params: userParamsSchema },
  }, async (req, res) => {
    await usersService.remove(req.user.orgId, req.params.id, req.user.id);
    return res.status(204).send();
  });
}
