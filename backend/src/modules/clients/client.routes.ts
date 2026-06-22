import { Request, Response, Router } from 'express';
import { asyncHandler } from '@/middlewares/errorHandler';
import { AppError } from '@/common/AppError';
import { authenticate } from '@/middlewares/auth';
import { createClientSchema, updateClientSchema, listClientsQuerySchema } from './client.schemas';
import { ClientService } from './client.service';

function requireOrgId(req: Request): string {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth.organizationId;
}

export const ClientController = {
  listAllLight: asyncHandler(async (req: Request, res: Response) => {
    const clients = await ClientService.listAllLight(requireOrgId(req));
    res.json(clients);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const query = listClientsQuerySchema.parse(req.query);
    const result = await ClientService.list(requireOrgId(req), query);
    res.json(result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const client = await ClientService.getById(requireOrgId(req), req.params.id);
    res.json(client);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const data = createClientSchema.parse(req.body);
    const client = await ClientService.create(requireOrgId(req), data);
    res.status(201).json(client);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const data = updateClientSchema.parse(req.body);
    const client = await ClientService.update(requireOrgId(req), req.params.id, data);
    res.json(client);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await ClientService.remove(requireOrgId(req), req.params.id);
    res.status(204).send();
  }),
};

const router = Router();
router.use(authenticate);

router.get('/all-light', ClientController.listAllLight);
router.get('/', ClientController.list);
router.get('/:id', ClientController.getById);
router.post('/', ClientController.create);
router.patch('/:id', ClientController.update);
router.delete('/:id', ClientController.remove);

export default router;
