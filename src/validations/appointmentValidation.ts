import { z } from 'zod';

const createAppointmentSchema = z
  .object({
    productId: z.string().trim().min(1, 'productId é obrigatório'),
    professionalId: z.string().trim().min(1, 'professionalId é obrigatório'),
    startDateTime: z.coerce.date(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.startDateTime.getTime() <= Date.now()) {
      ctx.addIssue({
        code: 'custom',
        message: 'startDateTime deve ser uma data/horário futuro',
        path: ['startDateTime'],
      });
    }
  });

const cancelAppointmentSchema = z
  .object({
    cancelReason: z.string().trim().min(1).optional(),
  })
  .strict();

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;

export { createAppointmentSchema, cancelAppointmentSchema };
