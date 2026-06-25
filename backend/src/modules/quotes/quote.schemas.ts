import { z } from 'zod';

export const quoteStatusEnum = z.enum(['BORRADOR', 'ENVIADA', 'ACEPTADA', 'RECHAZADA', 'VENCIDA']);
export const installmentAmountTypeEnum = z.enum(['FIXED', 'PERCENTAGE']);

export const quoteItemSchema = z.object({
  description: z.string().min(1).max(500),
  unitPrice: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().positive().default(1),
});

export const quoteInstallmentSchema = z
  .object({
    description: z.string().min(1).max(300),
    amountType: installmentAmountTypeEnum,
    fixedAmount: z.coerce.number().nonnegative().optional(),
    percentage: z.coerce.number().min(0).max(100).optional(),
  })
  .refine((data) => (data.amountType === 'FIXED' ? data.fixedAmount !== undefined : data.percentage !== undefined), {
    message: 'Debes indicar el monto fijo o el porcentaje según el tipo de cuota elegido.',
  });

export const createQuoteSchema = z.object({
  clientId: z.string().min(1),
  serviceId: z.string().optional(),
  description: z.string().min(3).max(3000),
  // basePrice/discount quedan opcionales: si se envían "items", el total se
  // calcula automáticamente a partir de ellos y estos campos se ignoran.
  // Si no hay items, funciona en modo simple (legado) igual que siempre.
  basePrice: z.coerce.number().nonnegative().optional(),
  discount: z.coerce.number().nonnegative().default(0),
  paymentTerms: z.string().max(500).optional(),
  validUntil: z.coerce.date().optional(),
  status: quoteStatusEnum.default('BORRADOR'),
  items: z.array(quoteItemSchema).optional(),
  installments: z.array(quoteInstallmentSchema).optional(),
});

export const updateQuoteSchema = createQuoteSchema.partial();

export const listQuotesQuerySchema = z.object({
  search: z.string().optional(),
  status: quoteStatusEnum.optional(),
  clientId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
