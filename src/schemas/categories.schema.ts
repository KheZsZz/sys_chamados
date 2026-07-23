import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(80),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const categoryParamsSchema = z.object({
  id: z.string().uuid(),
});
export type CategoryParams = z.infer<typeof categoryParamsSchema>;
