import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(2).max(160),
  description: z.string().max(1000).optional(),
  basePrice: z.coerce.number().nonnegative(),
  estimatedDays: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();
