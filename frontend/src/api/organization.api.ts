import { api } from '@/lib/api-client';

export const organizationApi = {
  getMine: () => api.get('/organizations/me').then((r) => r.data),

  onboardingStep1: (data: {
    organizationName: string;
    responsibleName: string;
    jobTitle?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  }) => api.post('/organizations/onboarding/step1', data).then((r) => r.data),

  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api
      .post('/organizations/onboarding/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },

  uploadSignatureImage: (file: File) => {
    const formData = new FormData();
    formData.append('signature', file);
    return api
      .post('/organizations/onboarding/signature/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  saveDrawnSignature: (dataUrl: string) =>
    api.post('/organizations/onboarding/signature/draw', { dataUrl }).then((r) => r.data),

  clearSignature: () => api.delete('/organizations/onboarding/signature').then((r) => r.data),

  onboardingStep4: (data: {
    useLogoOnQuotes: boolean;
    useLogoOnReports: boolean;
    useSignatureOnQuotes: boolean;
    useSignatureOnReports: boolean;
  }) => api.post('/organizations/onboarding/step4', data).then((r) => r.data),

  finishOnboarding: () => api.post('/organizations/onboarding/finish').then((r) => r.data),

  updateBranding: (data: Record<string, unknown>) => api.patch('/organizations/branding', data).then((r) => r.data),
};
