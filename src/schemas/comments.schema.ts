import { z } from 'zod';

export const createCommentSchema = z.object({
  body: z.string().min(1, 'Comentário não pode estar vazio').max(5000),
  isInternal: z.boolean().default(false),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const commentParamsSchema = z.object({
  ticketId: z.string().uuid(),
  commentId: z.string().uuid().optional(),
});
export type CommentParams = z.infer<typeof commentParamsSchema>;
