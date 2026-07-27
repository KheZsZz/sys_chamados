import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from '@fastify/type-provider-zod';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { notificationsService } from '@/services/notifications.service';
import {
  listNotificationsQuerySchema,
  notificationParamsSchema,
} from '@/schemas/notifications.schema';

export async function notificationsRoutes(routes: FastifyInstance) {
  const app = routes.withTypeProvider<ZodTypeProvider>();

  app.addHook('preHandler', authMiddleware);

  app.get('/', {
    schema: { querystring: listNotificationsQuerySchema },
  }, async (req, res) => {
    const result = await notificationsService.list(req.user.id, req.query);
    return res.status(200).send(result);
  });

  app.patch('/:id/read', {
    schema: { params: notificationParamsSchema },
  }, async (req, res) => {
    const notification = await notificationsService.markAsRead(req.user.id, req.params.id);
    return res.status(200).send(notification);
  });

  app.patch('/read-all', async (req, res) => {
    await notificationsService.markAllAsRead(req.user.id);
    return res.status(204).send();
  });
}
