import { prisma } from '@/libs/prisma';
import { Prisma } from '@/generated/prisma';
import { notFoundError } from '@/libs/errors';
import { ListNotificationsQuery } from '@/schemas/notifications.schema';

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
