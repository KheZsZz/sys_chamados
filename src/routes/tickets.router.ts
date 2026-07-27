import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from '@fastify/type-provider-zod';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { AccessMiddleware } from '@/middlewares/role.middleware';
import { ROLE_DEPARTAMENT } from '@/libs/roles';
import { ticketsService } from '@/services/tickets.service';
import {
  createTicketSchema,
  updateTicketSchema,
  ticketParamsSchema,
  listTicketsQuerySchema,
  assignTicketSchema,
} from '@/schemas/tickets.schema';

const ALL_DEPARTMENTS = Object.keys(ROLE_DEPARTAMENT);

export async function ticketsRoutes(routes: FastifyInstance) {
  const app = routes.withTypeProvider<ZodTypeProvider>();

  app.addHook('preHandler', authMiddleware);

  // Any authenticated user can open a ticket.
  app.post('/', {
    schema: { body: createTicketSchema },
  }, async (req, res) => {
    const ticket = await ticketsService.create(req.user.orgId, req.user.id, req.body);
    return res.status(201).send(ticket);
  });

  // REQUESTER sees only their own tickets; AGENT/ADMIN see all tickets in the org.
  app.get('/', {
    schema: { querystring: listTicketsQuerySchema },
  }, async (req, res) => {
    const result = await ticketsService.list(req.user.orgId, req.query, req.user);
    return res.status(200).send(result);
  });

  app.get('/:id', {
    schema: { params: ticketParamsSchema },
  }, async (req, res) => {
    const ticket = await ticketsService.getById(req.user.orgId, req.params.id, req.user);
    return res.status(200).send(ticket);
  });

  // REQUESTER can only edit title/description while the ticket is OPEN (enforced in the service).
  app.put('/:id', {
    schema: { params: ticketParamsSchema, body: updateTicketSchema },
  }, async (req, res) => {
    const ticket = await ticketsService.update(req.user.orgId, req.params.id, req.body, req.user);
    return res.status(200).send(ticket);
  });

  // Only AGENT/ADMIN can assign tickets.
  app.patch('/:id/assign', {
    preHandler: AccessMiddleware(ALL_DEPARTMENTS, 'AGENT'),
    schema: { params: ticketParamsSchema, body: assignTicketSchema },
  }, async (req, res) => {
    const ticket = await ticketsService.assign(
      req.user.orgId,
      req.params.id,
      req.body.assignedToId,
      req.user.id
    );
    return res.status(200).send(ticket);
  });
}
