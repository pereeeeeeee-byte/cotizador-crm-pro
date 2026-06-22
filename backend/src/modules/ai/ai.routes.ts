import { Request, Response, Router } from 'express';
import { asyncHandler } from '@/middlewares/errorHandler';
import { AppError } from '@/common/AppError';
import { authenticate } from '@/middlewares/auth';
import { aiDraftQuoteSchema } from './ai.schemas';
import { AiQuoteService } from './ai.service';

function requireAuth(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth;
}

export const AiController = {
  draftQuote: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const { clientNeedDescription } = aiDraftQuoteSchema.parse(req.body);
    const draft = await AiQuoteService.draftFromDescription(auth.organizationId, clientNeedDescription);
    res.json(draft);
  }),
};

const router = Router();
router.use(authenticate);

router.post('/draft-cotizacion', AiController.draftQuote);

export default router;
