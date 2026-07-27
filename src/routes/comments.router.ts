import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from '@fastify/type-provider-zod';
import { z } from 'zod';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { commentsService } from '@/services/comments.service';
import { createCommentSchema, commentParamsSchema } from '@/schemas/comments.schema';

export async function commentsRoutes(routes: FastifyInstance) {
  const app = routes.withTypeProvider<ZodTypeProvider>();

  app.addHook('preHandler', authMiddleware);

  app.post('/:ticketId/comments', {
    schema: {
      params: commentParamsSchema.pick({ ticketId: true }),
      body: createCommentSchema,
    },
  }, async (req, res) => {
    const comment = await commentsService.create(
      req.user.orgId,
      req.params.ticketId,
      req.user,
      req.body
    );
    return res.status(201).send(comment);
  });

  app.get('/:ticketId/comments', {
    schema: {
      params: commentParamsSchema.pick({ ticketId: true }),
    },
  }, async (req, res) => {
    const comments = await commentsService.list(req.user.orgId, req.params.ticketId, req.user);
    return res.status(200).send(comments);
  });

  app.delete('/:ticketId/comments/:commentId', {
    schema: {
      params: z.object({
        ticketId: z.string().uuid(),
        commentId: z.string().uuid(),
      }),
    },
  }, async (req, res) => {
    await commentsService.remove(
      req.user.orgId,
      req.params.ticketId,
      req.params.commentId,
      req.user
    );
    return res.status(204).send();
  });
}
