import { prisma } from '@/libs/prisma';
import { notFoundError, createAppError } from '@/libs/errors';
import { notifyUser } from '@/services/notifications.service';
import { CreateCommentInput } from '@/schemas/comments.schema';

interface RequestingUser {
  id: string;
  role: string;
}

async function getAccessibleTicket(orgId: string, ticketId: string, requestingUser: RequestingUser) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      orgId,
      ...(requestingUser.role === 'REQUESTER' ? { requesterId: requestingUser.id } : {}),
    },
  });

  if (!ticket) {
    throw notFoundError('Ticket not found.');
  }

  return ticket;
}

export const commentsService = {
  create: async (
    orgId: string,
    ticketId: string,
    requestingUser: RequestingUser,
    input: CreateCommentInput
  ) => {
    await getAccessibleTicket(orgId, ticketId, requestingUser);

    if (requestingUser.role === 'REQUESTER' && input.isInternal) {
      throw createAppError('You are not allowed to create internal comments.', 403);
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId,
        userId: requestingUser.id,
        body: input.body,
        isInternal: input.isInternal,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Only notify the requester for public comments made by staff.
    // Internal comments are invisible to the requester (see list() filter below),
    // so notifying them would leak the existence of internal discussion
    // and point them to a comment they can't actually open.
    if (requestingUser.role !== 'REQUESTER' && !input.isInternal) {
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      if (ticket && ticket.requesterId !== requestingUser.id) {
        await notifyUser({
          userId: ticket.requesterId,
          ticketId,
          type: 'NEW_COMMENT',
          ticketTitle: ticket.title,
        });
      }
    }

    return comment;
  },

  list: async (orgId: string, ticketId: string, requestingUser: RequestingUser) => {
    await getAccessibleTicket(orgId, ticketId, requestingUser);

    return prisma.ticketComment.findMany({
      where: {
        ticketId,
        ...(requestingUser.role === 'REQUESTER' ? { isInternal: false } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  remove: async (orgId: string, ticketId: string, commentId: string, requestingUser: RequestingUser) => {
    await getAccessibleTicket(orgId, ticketId, requestingUser);

    const comment = await prisma.ticketComment.findFirst({
      where: { id: commentId, ticketId },
    });

    if (!comment) {
      throw notFoundError('Comment not found.');
    }

    if (requestingUser.role === 'REQUESTER' && comment.userId !== requestingUser.id) {
      throw createAppError('You can only delete your own comments.', 403);
    }

    await prisma.ticketComment.delete({ where: { id: commentId } });
  },
};
