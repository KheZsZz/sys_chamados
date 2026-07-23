import { z } from 'zod';
import { ticketPrioritySchema } from '@/schemas/enum.schema';

export const createSlaPolicySchema = z
  .object({
    priority: ticketPrioritySchema,
    responseTimeMinutes: z.number().int().positive(),
    resolutionTimeMinutes: z.number().int().positive(),
  })
  .refine((data) => data.resolutionTimeMinutes >= data.responseTimeMinutes, {
    message: 'Tempo de resolução deve ser maior ou igual ao tempo de resposta',
    path: ['resolutionTimeMinutes'],
  });
export type CreateSlaPolicyInput = z.infer<typeof createSlaPolicySchema>;

export const updateSlaPolicySchema = z.object({
  responseTimeMinutes: z.number().int().positive().optional(),
  resolutionTimeMinutes: z.number().int().positive().optional(),
});
export type UpdateSlaPolicyInput = z.infer<typeof updateSlaPolicySchema>;

export const slaPolicyParamsSchema = z.object({
  id: z.string().uuid(),
});
export type SlaPolicyParams = z.infer<typeof slaPolicyParamsSchema>;
