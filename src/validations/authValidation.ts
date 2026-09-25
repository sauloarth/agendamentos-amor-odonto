import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  email: z.email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  phone: z.string().trim().min(1).optional(),
});

const loginSchema = z.object({
  email: z.email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, 'Nome é obrigatório').optional(),
    phone: z.string().trim().min(1).nullable().optional(),
    currentPassword: z.string().min(1, 'Senha atual é obrigatória').optional(),
    newPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({ code: 'custom', message: 'Informe ao menos um campo para atualizar', path: [] });
    }
    if (data.newPassword !== undefined && data.currentPassword === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'Senha atual é obrigatória para trocar a senha',
        path: ['currentPassword'],
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export { registerSchema, loginSchema, updateProfileSchema };
