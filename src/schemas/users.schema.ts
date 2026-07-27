import { z } from 'zod';
import { userRoleSchema, departmentSchema } from '@/schemas/enum.schema';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name too short').max(120),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(8).max(20).optional(),
  role: userRoleSchema.default('REQUESTER'),
  department: departmentSchema.default('ADMINISTRATIVE'),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  phone: z.string().min(8).max(20).nullable().optional(),
  role: userRoleSchema.optional(),
  department: departmentSchema.optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const changePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const userParamsSchema = z.object({
  id: z.string().uuid(),
});
export type UserParams = z.infer<typeof userParamsSchema>;

export const listUsersQuerySchema = z.object({
  role: userRoleSchema.optional(),
  department: departmentSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
