import { z } from 'zod';

const updateUserRoleSchema = z.object({
  role: z.enum(['client', 'professional']),
});

const listUsersQuerySchema = z.object({
  role: z.enum(['client', 'professional', 'admin']).optional(),
  search: z.string().trim().min(1).optional(),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export { updateUserRoleSchema, listUsersQuerySchema };
