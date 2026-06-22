import { z } from 'zod';

export const leadSourceEnum = z.enum([
  'FACEBOOK',
  'MARKETPLACE',
  'INSTAGRAM',
  'GOOGLE',
  'WHATSAPP',
  'REFERIDO',
  'OTRO',
]);

export const clientStatusEnum = z.enum([
  'NUEVO',
  'COTIZADO',
  'EN_NEGOCIACION',
  'PENDIENTE_DOCUMENTOS',
  'TRABAJO_CONTRATADO',
  'TRABAJO_TERMINADO',
  'CLIENTE_PERDIDO',
]);

export const createClientSchema = z.object({
  fullName: z.string().min(2).max(160),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(255).optional(),
  comuna: z.string().max(120).optional(),
  city: z.string().max(120).optional(),
  source: leadSourceEnum.default('OTRO'),
  status: clientStatusEnum.default('NUEVO'),
  notes: z.string().max(2000).optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const listClientsQuerySchema = z.object({
  search: z.string().optional(),
  status: clientStatusEnum.optional(),
  source: leadSourceEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
