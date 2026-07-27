import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from '@fastify/type-provider-zod';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { AccessMiddleware } from '@/middlewares/role.middleware';
import { ROLE_DEPARTAMENT } from '@/libs/roles';
import { categoriesService } from '@/services/categories.service';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryParamsSchema,
} from '@/schemas/categories.schema';

const ALL_DEPARTMENTS = Object.keys(ROLE_DEPARTAMENT);

export async function categoriesRoutes(routes: FastifyInstance) {
  const app = routes.withTypeProvider<ZodTypeProvider>();

  app.addHook('preHandler', authMiddleware);

  // Any authenticated user can read categories (needed to open tickets).
  app.get('/', async (req, res) => {
    const categories = await categoriesService.list(req.user.orgId);
    return res.status(200).send(categories);
  });

  app.get('/:id', {
    schema: { params: categoryParamsSchema },
  }, async (req, res) => {
    const category = await categoriesService.getById(req.user.orgId, req.params.id);
    return res.status(200).send(category);
  });

  // Only ADMIN can create, update or delete categories.
  app.post('/', {
    preHandler: AccessMiddleware(ALL_DEPARTMENTS, 'ADMIN'),
    schema: { body: createCategorySchema },
  }, async (req, res) => {
    const category = await categoriesService.create(req.user.orgId, req.body);
    return res.status(201).send(category);
  });

  app.put('/:id', {
    preHandler: AccessMiddleware(ALL_DEPARTMENTS, 'ADMIN'),
    schema: { params: categoryParamsSchema, body: updateCategorySchema },
  }, async (req, res) => {
    const category = await categoriesService.update(req.user.orgId, req.params.id, req.body);
    return res.status(200).send(category);
  });

  app.delete('/:id', {
    preHandler: AccessMiddleware(ALL_DEPARTMENTS, 'ADMIN'),
    schema: { params: categoryParamsSchema },
  }, async (req, res) => {
    await categoriesService.remove(req.user.orgId, req.params.id);
    return res.status(204).send();
  });
}
