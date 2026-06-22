import { z } from 'zod';

export const createActivitySchema = z.object({
  clientId: z.string().min(1),
  quoteId: z.string().optional(),
  type: z.enum(['LLAMADA', 'WHATSAPP', 'CORREO', 'REUNION', 'VISITA_TECNICA']),
  occurredAt: z.coerce.date().default(() => new Date()),
  comment: z.string().max(2000).optional(),
  result: z.enum(['POSITIVO', 'NEUTRO', 'NEGATIVO', 'SIN_RESPUESTA']).optional(),
});
