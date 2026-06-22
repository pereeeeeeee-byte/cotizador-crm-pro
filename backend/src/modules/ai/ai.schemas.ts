import { z } from 'zod';

export const aiDraftQuoteSchema = z.object({
  clientNeedDescription: z.string().min(10).max(2000),
});
