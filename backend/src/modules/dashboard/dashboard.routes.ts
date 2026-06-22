import { Request, Response, Router } from 'express';
import { asyncHandler } from '@/middlewares/errorHandler';
import { AppError } from '@/common/AppError';
import { authenticate } from '@/middlewares/auth';
import { DashboardService } from './dashboard.service';

function requireAuth(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth;
}

export const DashboardController = {
  summary: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const summary = await DashboardService.getSummary(auth.organizationId);
    res.json(summary);
  }),

  charts: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const months = req.query.months ? Number(req.query.months) : 6;
    const charts = await DashboardService.getMonthlyCharts(auth.organizationId, months);
    res.json(charts);
  }),
};

const router = Router();
router.use(authenticate);

router.get('/resumen', DashboardController.summary);
router.get('/graficos', DashboardController.charts);

export default router;
