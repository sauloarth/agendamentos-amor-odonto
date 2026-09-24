import { z } from 'zod';

const updateUserRoleSchema = z.object({
  role: z.enum(['client', 'professional']),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export { updateUserRoleSchema };
