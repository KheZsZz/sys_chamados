import { prisma } from '@/libs/prisma';
import { ImagekitClient } from '@/libs/imagekit';
import { notFoundError, createAppError, badRequestError } from '@/libs/errors';
import { attachmentMetadataSchema } from '@/schemas/attachments.schema';
import { ZodError } from 'zod';

interface RequestingUser {
  id: string;
  role: string;
}

interface UploadFileInput {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  commentId?: string;
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

export const attachmentsService = {
  upload: async (
    orgId: string,
    ticketId: string,
    requestingUser: RequestingUser,
    input: UploadFileInput
  ) => {
    await getAccessibleTicket(orgId, ticketId, requestingUser);

    try {
      attachmentMetadataSchema.parse({
        ticketId,
        commentId: input.commentId,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      });
    } catch (err) {
      if (err instanceof ZodError) {
        throw badRequestError(err.issues.map((i) => i.message).join(', '));
      }
      throw err;
    }

    if (input.commentId) {
      const comment = await prisma.ticketComment.findFirst({
        where: { id: input.commentId, ticketId },
      });
      if (!comment) {
        throw badRequestError('Invalid commentId for this ticket.');
      }
    }

    const uploadResult = await ImagekitClient.uploadFile(input.buffer, input.fileName, '/tickets');

    try {
      return await prisma.ticketAttachment.create({
        data: {
          ticketId,
          commentId: input.commentId,
          fileId: uploadResult.fileId,
          fileUrl: uploadResult.url,
          fileName: input.fileName,
          sizeBytes: input.sizeBytes,
          uploadedBy: requestingUser.id,
        },
      });
    } catch (err) {
      // Roll back the Imagekit upload if we fail to persist the DB record,
      // so we don't leave orphaned files in storage.
      await ImagekitClient.deleteFile(uploadResult.fileId).catch(() => {});
      throw err;
    }
  },

  list: async (orgId: string, ticketId: string, requestingUser: RequestingUser) => {
    await getAccessibleTicket(orgId, ticketId, requestingUser);

    return prisma.ticketAttachment.findMany({
      where: { ticketId },
      include: {
        uploader: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  remove: async (
    orgId: string,
    ticketId: string,
    attachmentId: string,
    requestingUser: RequestingUser
  ) => {
    await getAccessibleTicket(orgId, ticketId, requestingUser);

    const attachment = await prisma.ticketAttachment.findFirst({
      where: { id: attachmentId, ticketId },
    });

    if (!attachment) {
      throw notFoundError('Attachment not found.');
    }

    if (requestingUser.role === 'REQUESTER' && attachment.uploadedBy !== requestingUser.id) {
      throw createAppError('You can only delete your own attachments.', 403);
    }

    try {
      await ImagekitClient.deleteFile(attachment.fileId);
    } catch (err) {
      // If the file was already removed on Imagekit's side (or the fileId is stale),
      // we still want to clean up our own database record instead of getting stuck.
      console.warn(`Failed to delete file ${attachment.fileId} from Imagekit:`, err);
    }

    await prisma.ticketAttachment.delete({ where: { id: attachmentId } });
  },
};
