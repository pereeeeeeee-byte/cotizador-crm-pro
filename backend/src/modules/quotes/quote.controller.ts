import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/errorHandler';
import { AppError } from '@/common/AppError';
import { createQuoteSchema, updateQuoteSchema, listQuotesQuerySchema } from './quote.schemas';
import { QuoteService } from './quote.service';
import { QuotePdfService } from './quote-pdf.service';

function requireAuth(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth;
}

export const QuoteController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const query = listQuotesQuerySchema.parse(req.query);
    const result = await QuoteService.list(auth.organizationId, query);
    res.json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const quote = await QuoteService.getById(auth.organizationId, req.params.id);
    res.json(quote);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const data = createQuoteSchema.parse(req.body);
    const quote = await QuoteService.create(auth.organizationId, auth.sub, data);
    res.status(201).json(quote);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const data = updateQuoteSchema.parse(req.body);
    const quote = await QuoteService.update(auth.organizationId, req.params.id, data);
    res.json(quote);
  }),

  duplicate: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const quote = await QuoteService.duplicate(auth.organizationId, req.params.id, auth.sub);
    res.status(201).json(quote);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    await QuoteService.remove(auth.organizationId, req.params.id);
    res.status(204).send();
  }),

  generatePdf: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const url = await QuotePdfService.generateAndStore(auth.organizationId, req.params.id);
    res.json({ pdfUrl: url });
  }),

  toggleInstallmentPaid: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const { isPaid } = req.body as { isPaid: boolean };
    const installment = await QuoteService.toggleInstallmentPaid(
      auth.organizationId,
      req.params.id,
      req.params.installmentId,
      Boolean(isPaid)
    );
    res.json(installment);
  }),
};
