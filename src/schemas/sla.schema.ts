import { z } from 'zod';
import { ticketPrioritySchema } from '@/schemas/enum.schema';

export const createSlaPolicySchema = z
  .object({
    priority: ticketPrioritySchema,
    responseTimeMinutes: z.number().int().positive(),
    resolutionTimeMinutes: z.number().int().positive(),
  })
  .refine((data) => data.resolutionTimeMinutes >= data.responseTimeMinutes, {
    message: 'Resolution time must be greater than or equal to response time',
    path: ['resolutionTimeMinutes'],
  });
export type CreateSlaPolicyInput = z.infer<typeof createSlaPolicySchema>;

export const updateSlaPolicySchema = z
  .object({
    responseTimeMinutes: z.number().int().positive().optional(),
    resolutionTimeMinutes: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      if (data.responseTimeMinutes === undefined || data.resolutionTimeMinutes === undefined) {
        return true;
      }
      return data.resolutionTimeMinutes >= data.responseTimeMinutes;
    },
    {
      message: 'Resolution time must be greater than or equal to response time',
      path: ['resolutionTimeMinutes'],
    }
  );
export type UpdateSlaPolicyInput = z.infer<typeof updateSlaPolicySchema>;

export const slaPolicyParamsSchema = z.object({
  id: z.string().uuid(),
});
export type SlaPolicyParams = z.infer<typeof slaPolicyParamsSchema>;
