import { Request, Response, Router } from 'express';
import { asyncHandler } from '@/middlewares/errorHandler';
import { AppError } from '@/common/AppError';
import { authenticate, requireRole } from '@/middlewares/auth';
import { createServiceSchema, updateServiceSchema } from './service.schemas';
import { ServiceCatalogService } from './service.service';

function requireOrgId(req: Request): string {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth.organizationId;
}

export const ServiceController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const includeInactive = req.query.includeInactive === 'true';
    const services = await ServiceCatalogService.list(requireOrgId(req), includeInactive);
    res.json(services);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = createServiceSchema.parse(req.body);
    const service = await ServiceCatalogService.create(requireOrgId(req), data);
    res.status(201).json(service);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = updateServiceSchema.parse(req.body);
    const service = await ServiceCatalogService.update(requireOrgId(req), req.params.id, data);
    res.json(service);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await ServiceCatalogService.remove(requireOrgId(req), req.params.id);
    res.status(204).send();
  }),
};

const router = Router();
router.use(authenticate);

router.get('/', ServiceController.list);
router.post('/', requireRole('ADMIN'), ServiceController.create);
router.patch('/:id', requireRole('ADMIN'), ServiceController.update);
router.delete('/:id', requireRole('ADMIN'), ServiceController.remove);

export default router;
