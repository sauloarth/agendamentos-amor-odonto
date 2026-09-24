import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const singleBlockSchema = z
  .object({
    type: z.literal('single'),
    professional: z.string().trim().min(1).optional(),
    reason: z.string().trim().min(1).optional(),
    startDateTime: z.coerce.date(),
    endDateTime: z.coerce.date(),
  })
  .strict();

const recurringBlockSchema = z
  .object({
    type: z.literal('recurring'),
    professional: z.string().trim().min(1).optional(),
    reason: z.string().trim().min(1).optional(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1, 'Informe ao menos um dia da semana'),
    startTime: z.string().regex(timeRegex, 'startTime deve estar no formato HH:mm'),
    endTime: z.string().regex(timeRegex, 'endTime deve estar no formato HH:mm'),
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional(),
  })
  .strict();

const createBlockSchema = z
  .discriminatedUnion('type', [singleBlockSchema, recurringBlockSchema])
  .superRefine((data, ctx) => {
    if (data.type === 'single') {
      if (data.endDateTime <= data.startDateTime) {
        ctx.addIssue({
          code: 'custom',
          message: 'endDateTime deve ser posterior a startDateTime',
          path: ['endDateTime'],
        });
      }
    } else {
      if (data.endTime <= data.startTime) {
        ctx.addIssue({ code: 'custom', message: 'endTime deve ser posterior a startTime', path: ['endTime'] });
      }
      if (data.validFrom && data.validUntil && data.validUntil <= data.validFrom) {
        ctx.addIssue({
          code: 'custom',
          message: 'validUntil deve ser posterior a validFrom',
          path: ['validUntil'],
        });
      }
    }
  });

const updateBlockSchema = z
  .object({
    professional: z.string().trim().min(1).nullable().optional(),
    reason: z.string().trim().min(1).optional(),
    active: z.boolean().optional(),

    startDateTime: z.coerce.date().optional(),
    endDateTime: z.coerce.date().optional(),

    daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1, 'Informe ao menos um dia da semana').optional(),
    startTime: z.string().regex(timeRegex, 'startTime deve estar no formato HH:mm').optional(),
    endTime: z.string().regex(timeRegex, 'endTime deve estar no formato HH:mm').optional(),
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.startDateTime && data.endDateTime && data.endDateTime <= data.startDateTime) {
      ctx.addIssue({
        code: 'custom',
        message: 'endDateTime deve ser posterior a startDateTime',
        path: ['endDateTime'],
      });
    }
    if (data.startTime && data.endTime && data.endTime <= data.startTime) {
      ctx.addIssue({ code: 'custom', message: 'endTime deve ser posterior a startTime', path: ['endTime'] });
    }
    if (data.validFrom && data.validUntil && data.validUntil <= data.validFrom) {
      ctx.addIssue({ code: 'custom', message: 'validUntil deve ser posterior a validFrom', path: ['validUntil'] });
    }
  });

export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;

export { createBlockSchema, updateBlockSchema };
