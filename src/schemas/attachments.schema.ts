import { z } from 'zod';

export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 05MB

export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/zip',
] as const;

export const attachmentMetadataSchema = z.object({
  ticketId: z.string().uuid(),
  commentId: z.string().uuid().optional(),
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_ATTACHMENT_SIZE_BYTES, 'Arquivo excede o limite de 5MB'),
});
export type AttachmentMetadataInput = z.infer<typeof attachmentMetadataSchema>;

export const attachmentParamsSchema = z.object({
  ticketId: z.string().uuid(),
  attachmentId: z.string().uuid(),
});
export type AttachmentParams = z.infer<typeof attachmentParamsSchema>;
