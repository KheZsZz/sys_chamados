import { prisma } from '@/libs/prisma';
import { notifyUser } from '@/services/notifications.service';

interface BreachedTicketRow {
  id: string;
  title: string;
  requesterId: string;
  assignedToId: string | null;
}

export const slaCheckerService = {
  checkBreachedTickets: async () => {
    const breachedTickets = await prisma.$queryRaw<BreachedTicketRow[]>`
      UPDATE tickets
      SET sla_breached = true
      WHERE sla_due_at < now()
        AND sla_breached = false
        AND status NOT IN ('RESOLVED', 'CLOSED')
      RETURNING
        id,
        title,
        requester_id AS "requesterId",
        assigned_to_id AS "assignedToId"
    `;

    for (const ticket of breachedTickets) {
      if (ticket.assignedToId) {
        await notifyUser({
          userId: ticket.assignedToId,
          ticketId: ticket.id,
          type: 'SLA_BREACHED',
          ticketTitle: ticket.title,
        }).catch((err) => console.warn('Failed to notify assigned agent of SLA breach:', err));
      }

      await notifyUser({
        userId: ticket.requesterId,
        ticketId: ticket.id,
        type: 'SLA_BREACHED',
        ticketTitle: ticket.title,
      }).catch((err) => console.warn('Failed to notify requester of SLA breach:', err));
    }

    return breachedTickets.length;
  },
};
