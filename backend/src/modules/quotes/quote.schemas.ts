import { z } from 'zod';

export const quoteStatusEnum = z.enum(['BORRADOR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA', 'VENCIDA']);

export const createQuoteSchema = z.object({
  clientId: z.string().min(1),
  serviceId: z.string().optional(),
  description: z.string().min(3).max(3000),
  basePrice: z.coerce.number().nonnegative(),
  discount: z.coerce.number().nonnegative().default(0),
  paymentTerms: z.string().max(500).optional(),
  validUntil: z.coerce.date().optional(),
  status: quoteStatusEnum.default('BORRADOR'),
});

export const updateQuoteSchema = createQuoteSchema.partial();

export const listQuotesQuerySchema = z.object({
  search: z.string().optional(),
  status: quoteStatusEnum.optional(),
  clientId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
