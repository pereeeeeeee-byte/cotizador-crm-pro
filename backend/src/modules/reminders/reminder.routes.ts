import { Request, Response, Router } from 'express';
import { asyncHandler } from '@/middlewares/errorHandler';
import { AppError } from '@/common/AppError';
import { authenticate } from '@/middlewares/auth';
import { createReminderSchema, quickReminderSchema, updateReminderSchema } from './reminder.schemas';
import { ReminderService } from './reminder.service';

function requireAuth(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth;
}

export const ReminderController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const status = req.query.status as string | undefined;
    const reminders = await ReminderService.list(auth.organizationId, status);
    res.json(reminders);
  }),

  today: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const reminders = await ReminderService.listToday(auth.organizationId);
    res.json(reminders);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const data = createReminderSchema.parse(req.body);
    const reminder = await ReminderService.create(auth.organizationId, auth.sub, data);
    res.status(201).json(reminder);
  }),

  createQuick: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const data = quickReminderSchema.parse(req.body);
    const reminder = await ReminderService.createQuick(auth.organizationId, auth.sub, data);
    res.status(201).json(reminder);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const data = updateReminderSchema.parse(req.body);
    const reminder = await ReminderService.update(auth.organizationId, req.params.id, data);
    res.json(reminder);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    await ReminderService.remove(auth.organizationId, req.params.id);
    res.status(204).send();
  }),
};

const router = Router();
router.use(authenticate);

router.get('/', ReminderController.list);
router.get('/hoy', ReminderController.today);
router.post('/', ReminderController.create);
router.post('/rapido', ReminderController.createQuick);
router.patch('/:id', ReminderController.update);
router.delete('/:id', ReminderController.remove);

export default router;
