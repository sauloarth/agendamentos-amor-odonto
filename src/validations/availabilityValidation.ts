import { z } from 'zod';

const objectIdSchema = z.string().trim().regex(/^[0-9a-f]{24}$/i, 'ID inválido');

const MAX_RANGE_DAYS = 90;

const getAvailabilitySchema = z
  .object({
    professionalId: objectIdSchema,
    productId: objectIdSchema,
    dateStart: z.coerce.date(),
    dateEnd: z.coerce.date(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.dateEnd <= data.dateStart) {
      ctx.addIssue({
        code: 'custom',
        message: 'dateEnd deve ser posterior a dateStart',
        path: ['dateEnd'],
      });
      return;
    }

    const rangeMs = data.dateEnd.getTime() - data.dateStart.getTime();
    if (rangeMs > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
      ctx.addIssue({
        code: 'custom',
        message: `Período máximo permitido é de ${MAX_RANGE_DAYS} dias`,
        path: ['dateEnd'],
      });
    }
  });

export type GetAvailabilityInput = z.infer<typeof getAvailabilitySchema>;

export { getAvailabilitySchema };
