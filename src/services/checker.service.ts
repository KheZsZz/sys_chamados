import { prisma } from '@/libs/prisma';
import { notifyUser } from '@/services/notifications.service';

interface BreachedTicketRow {
  id: string;
  title: string;
  requesterId: string;
  assignedToId: string | null;
}

/**
 * Atomically claims tickets whose SLA deadline has passed and marks them as
 * breached in a single UPDATE ... RETURNING statement. This is intentionally
 * NOT a "SELECT overdue tickets" followed by a separate "UPDATE" — doing it
 * in one atomic statement means that if this function is triggered twice
 * concurrently (e.g. two cron calls overlapping, or misconfigured double
 * scheduling), the second call's WHERE clause simply won't match rows the
 * first call already flipped to `sla_breached = true`, so no ticket gets
 * processed — and no user gets notified — twice.
 *
 * Only the assigned agent and the requester are notified. Never a whole
 * department/team.
 */
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
