import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  durationMinutes: z.number().int().positive('Duração deve ser maior que zero'),
  price: z.number().nonnegative('Preço não pode ser negativo'),
});

const updateProductSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').optional(),
  durationMinutes: z.number().int().positive('Duração deve ser maior que zero').optional(),
  price: z.number().nonnegative('Preço não pode ser negativo').optional(),
  active: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export { createProductSchema, updateProductSchema };
