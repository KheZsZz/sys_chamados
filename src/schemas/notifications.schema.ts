import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  onlyUnread: z.coerce.boolean().default(false),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

export const notificationParamsSchema = z.object({
  id: z.string().uuid(),
});
export type NotificationParams = z.infer<typeof notificationParamsSchema>;
