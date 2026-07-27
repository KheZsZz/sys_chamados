import { prisma } from '@/libs/prisma';
import { Prisma } from '@/generated/prisma';
import { createAppError, notFoundError, badRequestError } from '@/libs/errors';
import {
  CreateTicketInput,
  UpdateTicketInput,
  ListTicketsQuery,
} from '@/schemas/tickets.schema';

interface RequestingUser {
  id: string;
  role: string;
}

const REQUESTER_EDITABLE_FIELDS = ['title', 'description'] as const;

function scopedWhere(orgId: string, requestingUser: RequestingUser): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = { orgId };
  if (requestingUser.role === 'REQUESTER') {
    where.requesterId = requestingUser.id;
  }
  return where;
}

async function recordHistory(
  ticketId: string,
  userId: string,
  changes: Array<{ field: string; oldValue: unknown; newValue: unknown }>
) {
  const entries = changes.filter((c) => c.oldValue !== c.newValue && c.newValue !== undefined);
  if (entries.length === 0) return;

  await prisma.ticketHistory.createMany({
    data: entries.map((c) => ({
      ticketId,
      userId,
      fieldChanged: c.field,
      oldValue: c.oldValue == null ? null : String(c.oldValue),
      newValue: c.newValue == null ? null : String(c.newValue),
    })),
  });
}

export const ticketsService = {
  create: async (orgId: string, requesterId: string, input: CreateTicketInput) => {
    if (input.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: input.categoryId, orgId },
      });
      if (!category) {
        throw badRequestError('Invalid categoryId for this organization.');
      }
    }

    const slaPolicy = await prisma.slaPolicy.findUnique({
      where: { orgId_priority: { orgId, priority: input.priority } },
    });

    const slaDueAt = slaPolicy
      ? new Date(Date.now() + slaPolicy.resolutionTimeMinutes * 60_000)
      : null;

    return prisma.ticket.create({
      data: {
        orgId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        categoryId: input.categoryId,
        requesterId,
        slaPolicyId: slaPolicy?.id,
        slaDueAt,
      },
    });
  },

  list: async (orgId: string, query: ListTicketsQuery, requestingUser: RequestingUser) => {
    const where: Prisma.TicketWhereInput = {
      ...scopedWhere(orgId, requestingUser),
      status: query.status,
      priority: query.priority,
      categoryId: query.categoryId,
      assignedToId: query.assignedToId,
    };

    const [items, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          requester: { select: { id: true, name: true, email: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return {
      items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  },

  getById: async (orgId: string, id: string, requestingUser: RequestingUser) => {
    const ticket = await prisma.ticket.findFirst({
      where: { id, ...scopedWhere(orgId, requestingUser) },
      include: {
        category: true,
        slaPolicy: true,
        requester: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        history: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!ticket) {
      throw notFoundError('Ticket not found.');
    }

    return ticket;
  },

  update: async (
    orgId: string,
    id: string,
    input: UpdateTicketInput,
    requestingUser: RequestingUser
  ) => {
    const ticket = await prisma.ticket.findFirst({
      where: { id, ...scopedWhere(orgId, requestingUser) },
    });

    if (!ticket) {
      throw notFoundError('Ticket not found.');
    }

    if (requestingUser.role === 'REQUESTER') {
      const disallowedFieldSent = Object.keys(input).some(
        (key) => !REQUESTER_EDITABLE_FIELDS.includes(key as any)
      );
      if (disallowedFieldSent) {
        throw createAppError('You are only allowed to edit the title and description.', 403);
      }
      if (ticket.status !== 'OPEN') {
        throw createAppError('This ticket can no longer be edited.', 403);
      }
    }

    if (input.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: input.categoryId, orgId },
      });
      if (!category) {
        throw badRequestError('Invalid categoryId for this organization.');
      }
    }

    if (input.assignedToId) {
      const assignee = await prisma.user.findFirst({
        where: { id: input.assignedToId, orgId },
      });
      if (!assignee) {
        throw badRequestError('Invalid assignedToId for this organization.');
      }
    }

    let slaPolicyId = ticket.slaPolicyId;
    let slaDueAt = ticket.slaDueAt;
    if (input.priority && input.priority !== ticket.priority) {
      const slaPolicy = await prisma.slaPolicy.findUnique({
        where: { orgId_priority: { orgId, priority: input.priority } },
      });
      slaPolicyId = slaPolicy?.id ?? null;
      slaDueAt = slaPolicy
        ? new Date(Date.now() + slaPolicy.resolutionTimeMinutes * 60_000)
        : null;
    }

    const closedAt =
      input.status === 'CLOSED' && ticket.status !== 'CLOSED' ? new Date() : ticket.closedAt;

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: input.status,
        categoryId: input.categoryId,
        assignedToId: input.assignedToId,
        slaPolicyId,
        slaDueAt,
        closedAt,
      },
    });

    await recordHistory(id, requestingUser.id, [
      { field: 'title', oldValue: ticket.title, newValue: input.title },
      { field: 'description', oldValue: ticket.description, newValue: input.description },
      { field: 'priority', oldValue: ticket.priority, newValue: input.priority },
      { field: 'status', oldValue: ticket.status, newValue: input.status },
      { field: 'categoryId', oldValue: ticket.categoryId, newValue: input.categoryId },
      { field: 'assignedToId', oldValue: ticket.assignedToId, newValue: input.assignedToId },
    ]);

    if (input.status && input.status !== ticket.status) {
      await prisma.notification.create({
        data: {
          userId: ticket.requesterId,
          ticketId: id,
          type: 'TICKET_STATUS_CHANGED',
        },
      });
    }

    return updated;
  },

  assign: async (orgId: string, id: string, assignedToId: string, requestingUserId: string) => {
    const ticket = await prisma.ticket.findFirst({ where: { id, orgId } });
    if (!ticket) {
      throw notFoundError('Ticket not found.');
    }

    const assignee = await prisma.user.findFirst({ where: { id: assignedToId, orgId } });
    if (!assignee) {
      throw badRequestError('Invalid assignedToId for this organization.');
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        assignedToId,
        status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
      },
    });

    await recordHistory(id, requestingUserId, [
      { field: 'assignedToId', oldValue: ticket.assignedToId, newValue: assignedToId },
    ]);

    await prisma.notification.create({
      data: {
        userId: assignedToId,
        ticketId: id,
        type: 'TICKET_ASSIGNED',
      },
    });

    return updated;
  },
};
