import { z } from 'zod';

export const userRoleSchema = z.enum(['REQUESTER', 'AGENT', 'ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const ticketPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export type TicketPriority = z.infer<typeof ticketPrioritySchema>;

export const ticketStatusSchema = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'WAITING',
  'RESOLVED',
  'CLOSED',
]);
export type TicketStatus = z.infer<typeof ticketStatusSchema>;

export const notificationTypeSchema = z.enum([
  'TICKET_CREATED',
  'TICKET_ASSIGNED',
  'TICKET_STATUS_CHANGED',
  'NEW_COMMENT',
  'SLA_BREACHED',
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;
