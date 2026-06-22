import { Request, Response, Router } from 'express';
import { asyncHandler } from '@/middlewares/errorHandler';
import { AppError } from '@/common/AppError';
import { authenticate } from '@/middlewares/auth';
import { createActivitySchema } from './activity.schemas';
import { ActivityService } from './activity.service';

function requireAuth(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth;
}

export const ActivityController = {
  listByClient: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const activities = await ActivityService.listByClient(auth.organizationId, req.params.clientId);
    res.json(activities);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const data = createActivitySchema.parse(req.body);
    const activity = await ActivityService.create(auth.organizationId, auth.sub, data);
    res.status(201).json(activity);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    await ActivityService.remove(auth.organizationId, req.params.id);
    res.status(204).send();
  }),
};

const router = Router();
router.use(authenticate);

router.get('/cliente/:clientId', ActivityController.listByClient);
router.post('/', ActivityController.create);
router.delete('/:id', ActivityController.remove);

export default router;
