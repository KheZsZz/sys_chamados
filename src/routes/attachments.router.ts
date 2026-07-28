import { z } from 'zod';
import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from '@fastify/type-provider-zod';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { attachmentsService } from '@/services/attachments.service';
import { badRequestError } from '@/libs/errors';

export async function attachmentsRoutes(routes: FastifyInstance) {
  const app = routes.withTypeProvider<ZodTypeProvider>();
  app.addHook('preHandler', authMiddleware);

  app.post('/:ticketId/attachments', {
    schema: {
      params: z.object({ ticketId: z.string().uuid() }),
    },
    }, async (req, res) => {
    const file = await req.file();

    if (!file) {
      throw badRequestError('No file was sent.');
    }

    const buffer = await file.toBuffer();
    const commentId = typeof file.fields.commentId?.value === 'string'
      ? file.fields.commentId.value
      : undefined;

    const attachment = await attachmentsService.upload(req.user.orgId, req.params.ticketId, req.user, {
      buffer,
      fileName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: buffer.length,
      commentId,
    });

    return res.status(201).send(attachment);
  });
  app.get('/:ticketId/attachments', {
    schema: {
      params: z.object({ ticketId: z.string().uuid() }),
    },
    }, async (req, res) => {
    const attachments = await attachmentsService.list(req.user.orgId, req.params.ticketId, req.user);
    return res.status(200).send(attachments);
  });
  app.delete('/:ticketId/attachments/:attachmentId', {
    schema: {
      params: z.object({
        ticketId: z.string().uuid(),
        attachmentId: z.string().uuid(),
      }),
    },
    }, async (req, res) => {
    await attachmentsService.remove(req.user.orgId, req.params.ticketId, req.params.attachmentId, req.user);
    return res.status(204).send();
  });
}
