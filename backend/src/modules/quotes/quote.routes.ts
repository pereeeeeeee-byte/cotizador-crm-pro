import { Router } from 'express';
import { authenticate } from '@/middlewares/auth';
import { QuoteController } from './quote.controller';

const router = Router();
router.use(authenticate);

router.get('/', QuoteController.list);
router.get('/:id', QuoteController.getById);
router.post('/', QuoteController.create);
router.patch('/:id', QuoteController.update);
router.post('/:id/duplicate', QuoteController.duplicate);
router.delete('/:id', QuoteController.remove);
router.post('/:id/pdf', QuoteController.generatePdf);

export default router;
