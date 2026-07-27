import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from '@fastify/type-provider-zod';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { AccessMiddleware } from '@/middlewares/role.middleware';
import { ROLE_DEPARTAMENT } from '@/libs/roles';
import { slaService } from '@/services/sla.service';
import {
  createSlaPolicySchema,
  updateSlaPolicySchema,
  slaPolicyParamsSchema,
} from '@/schemas/sla.schema';

const ALL_DEPARTMENTS = Object.keys(ROLE_DEPARTAMENT);

export async function slaRoutes(routes: FastifyInstance) {
  const app = routes.withTypeProvider<ZodTypeProvider>();

  app.addHook('preHandler', authMiddleware);

  app.get('/', async (req, res) => {
    const policies = await slaService.list(req.user.orgId);
    return res.status(200).send(policies);
  });

  app.get('/:id', {
    schema: { params: slaPolicyParamsSchema },
  }, async (req, res) => {
    const policy = await slaService.getById(req.user.orgId, req.params.id);
    return res.status(200).send(policy);
  });

  app.post('/', {
    preHandler: AccessMiddleware(ALL_DEPARTMENTS, 'ADMIN'),
    schema: { body: createSlaPolicySchema },
  }, async (req, res) => {
    const policy = await slaService.create(req.user.orgId, req.body);
    return res.status(201).send(policy);
  });

  app.put('/:id', {
    preHandler: AccessMiddleware(ALL_DEPARTMENTS, 'ADMIN'),
    schema: { params: slaPolicyParamsSchema, body: updateSlaPolicySchema },
  }, async (req, res) => {
    const policy = await slaService.update(req.user.orgId, req.params.id, req.body);
    return res.status(200).send(policy);
  });

  app.delete('/:id', {
    preHandler: AccessMiddleware(ALL_DEPARTMENTS, 'ADMIN'),
    schema: { params: slaPolicyParamsSchema },
  }, async (req, res) => {
    await slaService.remove(req.user.orgId, req.params.id);
    return res.status(204).send();
  });
}
