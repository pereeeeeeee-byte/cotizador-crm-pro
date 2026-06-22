import { z } from 'zod';

export const onboardingStep1Schema = z.object({
  organizationName: z.string().min(2).max(120),
  responsibleName: z.string().min(2).max(120),
  jobTitle: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().max(255).optional(),
});

export const onboardingStep4Schema = z.object({
  useLogoOnQuotes: z.boolean().default(true),
  useLogoOnReports: z.boolean().default(true),
  useSignatureOnQuotes: z.boolean().default(true),
  useSignatureOnReports: z.boolean().default(false),
});

export const updateBrandingSchema = z.object({
  responsibleName: z.string().max(120).optional(),
  jobTitle: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().max(255).optional(),
  primaryColor: z.string().max(20).optional(),
  secondaryColor: z.string().max(20).optional(),
  useLogoOnQuotes: z.boolean().optional(),
  useLogoOnReports: z.boolean().optional(),
  useSignatureOnQuotes: z.boolean().optional(),
  useSignatureOnReports: z.boolean().optional(),
  currency: z.string().max(10).optional(),
  quotePrefix: z.string().max(20).optional(),
  pdfFooterNote: z.string().max(500).optional(),
});

export const signatureTypeSchema = z.object({
  signatureType: z.enum(['upload', 'drawn', 'none']),
});
