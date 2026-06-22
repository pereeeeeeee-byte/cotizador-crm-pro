import { Request, Response, Router } from 'express';
import { asyncHandler } from '@/middlewares/errorHandler';
import { AppError } from '@/common/AppError';
import { authenticate } from '@/middlewares/auth';
import { NotificationService } from './notification.service';

function requireAuth(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth;
}

export const NotificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const onlyUnread = req.query.unread === 'true';
    const notifications = await NotificationService.list(auth.organizationId, onlyUnread);
    res.json(notifications);
  }),

  markAsRead: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const notification = await NotificationService.markAsRead(auth.organizationId, req.params.id);
    res.json(notification);
  }),

  markAllAsRead: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    await NotificationService.markAllAsRead(auth.organizationId);
    res.status(204).send();
  }),
};

const router = Router();
router.use(authenticate);

router.get('/', NotificationController.list);
router.post('/:id/leida', NotificationController.markAsRead);
router.post('/marcar-todas-leidas', NotificationController.markAllAsRead);

export default router;
