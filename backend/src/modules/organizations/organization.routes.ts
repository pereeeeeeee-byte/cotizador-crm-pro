import { Router } from 'express';
import { authenticate, requireRole } from '@/middlewares/auth';
import { uploadImage } from '@/modules/uploads/multer.config';
import { OrganizationController } from './organization.controller';

const router = Router();

router.use(authenticate);

router.get('/me', OrganizationController.getMine);

// Onboarding (4 pasos)
router.post('/onboarding/step1', requireRole('ADMIN'), OrganizationController.onboardingStep1);
router.post('/onboarding/logo', requireRole('ADMIN'), uploadImage.single('logo'), OrganizationController.uploadLogo);
router.post(
  '/onboarding/signature/upload',
  requireRole('ADMIN'),
  uploadImage.single('signature'),
  OrganizationController.uploadSignatureImage
);
router.post('/onboarding/signature/draw', requireRole('ADMIN'), OrganizationController.saveDrawnSignature);
router.delete('/onboarding/signature', requireRole('ADMIN'), OrganizationController.clearSignature);
router.post('/onboarding/step4', requireRole('ADMIN'), OrganizationController.onboardingStep4);
router.post('/onboarding/finish', requireRole('ADMIN'), OrganizationController.finishOnboarding);

// Edición de branding post-onboarding
router.patch('/branding', requireRole('ADMIN'), OrganizationController.updateBranding);

// Numeración de cotizaciones
router.post('/quote-starting-number', requireRole('ADMIN'), OrganizationController.setQuoteStartingNumber);

export default router;
