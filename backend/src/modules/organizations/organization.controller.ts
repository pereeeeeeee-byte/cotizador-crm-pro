import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/errorHandler';
import { AppError } from '@/common/AppError';
import {
  onboardingStep1Schema,
  onboardingStep4Schema,
  updateBrandingSchema,
  setQuoteStartingNumberSchema,
} from './organization.schemas';
import { OrganizationService } from './organization.service';

function requireOrgId(req: Request): string {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth.organizationId;
}

export const OrganizationController = {
  getMine: asyncHandler(async (req: Request, res: Response) => {
    const org = await OrganizationService.getMyOrganization(requireOrgId(req));
    res.json(org);
  }),

  onboardingStep1: asyncHandler(async (req: Request, res: Response) => {
    const data = onboardingStep1Schema.parse(req.body);
    const branding = await OrganizationService.completeOnboardingStep1(requireOrgId(req), data);
    res.json(branding);
  }),

  uploadLogo: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw AppError.badRequest('No se recibió ningún archivo.');
    const branding = await OrganizationService.uploadLogo(requireOrgId(req), {
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    res.json(branding);
  }),

  uploadSignatureImage: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw AppError.badRequest('No se recibió ningún archivo.');
    const branding = await OrganizationService.uploadSignatureImage(requireOrgId(req), {
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    res.json(branding);
  }),

  saveDrawnSignature: asyncHandler(async (req: Request, res: Response) => {
    const { dataUrl } = req.body as { dataUrl?: string };
    if (!dataUrl) throw AppError.badRequest('Falta la imagen de la firma (dataUrl).');
    const branding = await OrganizationService.saveDrawnSignature(requireOrgId(req), dataUrl);
    res.json(branding);
  }),

  clearSignature: asyncHandler(async (req: Request, res: Response) => {
    const branding = await OrganizationService.clearSignature(requireOrgId(req));
    res.json(branding);
  }),

  onboardingStep4: asyncHandler(async (req: Request, res: Response) => {
    const data = onboardingStep4Schema.parse(req.body);
    const branding = await OrganizationService.updateUsagePreferences(requireOrgId(req), data);
    res.json(branding);
  }),

  finishOnboarding: asyncHandler(async (req: Request, res: Response) => {
    const org = await OrganizationService.finishOnboarding(requireOrgId(req));
    res.json(org);
  }),

  updateBranding: asyncHandler(async (req: Request, res: Response) => {
    const data = updateBrandingSchema.parse(req.body);
    const branding = await OrganizationService.updateBranding(requireOrgId(req), data);
    res.json(branding);
  }),

  setQuoteStartingNumber: asyncHandler(async (req: Request, res: Response) => {
    const { startAt } = setQuoteStartingNumberSchema.parse(req.body);
    const counter = await OrganizationService.setQuoteStartingNumber(requireOrgId(req), startAt);
    res.json(counter);
  }),
};
