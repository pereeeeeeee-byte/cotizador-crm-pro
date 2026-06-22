import { api } from '@/lib/api-client';

export const authApi = {
  register: (data: { organizationName: string; fullName: string; email: string; password: string }) =>
    api.post('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) => api.post('/auth/login', data).then((r) => r.data),

  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),

  me: () => api.get('/auth/me').then((r) => r.data),

  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }).then((r) => r.data),

  verifyEmail: (token: string) => api.post('/auth/verify-email', { token }).then((r) => r.data),
};
