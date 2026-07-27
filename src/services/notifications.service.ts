import { prisma } from '@/libs/prisma';
import { Prisma } from '@/generated/prisma';
import { notFoundError } from '@/libs/errors';
import { ListNotificationsQuery } from '@/schemas/notifications.schema';
import { NotificationType } from '@/schemas/enum.schema';
import { sendEmail } from '@/libs/email';
import { buildEmailContent } from '@/services/email-templates.service';

interface NotifyUserParams {
  userId: string;
  ticketId: string;
  type: NotificationType;
  ticketTitle: string;
  oldStatus?: string;
  newStatus?: string;
}

/**
 * Creates an in-app notification record and, best-effort, sends an email
 * about it via Resend. Email failures are logged but never bubble up —
 * a failed email must not break ticket/comment/assignment flows.
 */
export async function notifyUser({
  userId,
  ticketId,
  type,
  ticketTitle,
  oldStatus,
  newStatus,
}: NotifyUserParams) {
  const [notification, user] = await Promise.all([
    prisma.notification.create({ data: { userId, ticketId, type } }),
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
  ]);

  if (user) {
    const { subject, html } = buildEmailContent(type, {
      userName: user.name,
      ticketTitle,
      oldStatus,
      newStatus,
    });

    sendEmail(user.email, subject, html).catch((err) => {
      console.warn(`Failed to send "${type}" email notification to ${user.email}:`, err);
    });
  }

  return notification;
}

export const notificationsService = {
  list: async (userId: string, query: ListNotificationsQuery) => {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.onlyUnread ? { readAt: null } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: { ticket: { select: { id: true, title: true, status: true } } },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
        unreadCount,
      },
    };
  },

  markAsRead: async (userId: string, id: string) => {
    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) {
      throw notFoundError('Notification not found.');
    }

    if (notification.readAt) {
      return notification;
    }

    return prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  },

  markAllAsRead: async (userId: string) => {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  },
};
