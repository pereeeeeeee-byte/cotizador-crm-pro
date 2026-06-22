import { z } from 'zod';

export const createReminderSchema = z.object({
  clientId: z.string().optional(),
  quoteId: z.string().optional(),
  title: z.string().min(2).max(200),
  notes: z.string().max(1000).optional(),
  dueAt: z.coerce.date(),
});

export const quickReminderSchema = z.object({
  clientId: z.string().optional(),
  quoteId: z.string().optional(),
  title: z.string().min(2).max(200),
  daysFromNow: z.coerce.number().int().min(0).max(365),
});

export const updateReminderSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  notes: z.string().max(1000).optional(),
  dueAt: z.coerce.date().optional(),
  status: z.enum(['PENDIENTE', 'COMPLETADO', 'CANCELADO']).optional(),
});
