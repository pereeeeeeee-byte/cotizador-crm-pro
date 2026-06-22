import { Request, Response } from 'express';
import { Router } from 'express';
import { asyncHandler } from '@/middlewares/errorHandler';
import { AppError } from '@/common/AppError';
import { authenticate, requireRole } from '@/middlewares/auth';
import { createUserSchema, updateUserSchema, changeMyPasswordSchema } from './user.schemas';
import { UserService } from './user.service';

function requireAuth(req: Request) {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth;
}

export const UserController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const users = await UserService.list(auth.organizationId);
    res.json(users);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const data = createUserSchema.parse(req.body);
    const user = await UserService.create(auth.organizationId, data);
    res.status(201).json(user);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const data = updateUserSchema.parse(req.body);
    const user = await UserService.update(auth.organizationId, req.params.id, data);
    res.json(user);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    await UserService.remove(auth.organizationId, req.params.id, auth.sub);
    res.status(204).send();
  }),

  changeMyPassword: asyncHandler(async (req: Request, res: Response) => {
    const auth = requireAuth(req);
    const { currentPassword, newPassword } = changeMyPasswordSchema.parse(req.body);
    await UserService.changeMyPassword(auth.sub, currentPassword, newPassword);
    res.json({ message: 'Contraseña actualizada correctamente.' });
  }),
};

const router = Router();
router.use(authenticate);

router.get('/', requireRole('ADMIN'), UserController.list);
router.post('/', requireRole('ADMIN'), UserController.create);
router.patch('/:id', requireRole('ADMIN'), UserController.update);
router.delete('/:id', requireRole('ADMIN'), UserController.remove);
router.post('/me/change-password', UserController.changeMyPassword);

export default router;
