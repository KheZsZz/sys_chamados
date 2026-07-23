import { z } from 'zod';
import { ticketPrioritySchema, ticketStatusSchema } from '@/schemas/enum.schema';

export const createTicketSchema = z.object({
  title: z.string().min(3, 'Título muito curto').max(150),
  description: z.string().min(10, 'Descreva o problema com mais detalhes'),
  priority: ticketPrioritySchema.default('MEDIUM'),
  categoryId: z.string().uuid().optional(),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().min(10).optional(),
  priority: ticketPrioritySchema.optional(),
  status: ticketStatusSchema.optional(),
  categoryId: z.string().uuid().nullable().optional(),
  assignedToId: z.string().uuid().nullable().optional(),
});
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;

export const ticketParamsSchema = z.object({
  id: z.string().uuid(),
});
export type TicketParams = z.infer<typeof ticketParamsSchema>;

export const listTicketsQuerySchema = z.object({
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  categoryId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;

export const assignTicketSchema = z.object({
  assignedToId: z.string().uuid(),
});
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
