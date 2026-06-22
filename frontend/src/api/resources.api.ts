import { api } from '@/lib/api-client';

export const clientsApi = {
  list: (params: Record<string, unknown>) => api.get('/clients', { params }).then((r) => r.data),
  getById: (id: string) => api.get(`/clients/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post('/clients', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/clients/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/clients/${id}`),
};

export const servicesApi = {
  list: (includeInactive = false) =>
    api.get('/services', { params: { includeInactive } }).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post('/services', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/services/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/services/${id}`),
};

export const quotesApi = {
  list: (params: Record<string, unknown>) => api.get('/quotes', { params }).then((r) => r.data),
  getById: (id: string) => api.get(`/quotes/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post('/quotes', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/quotes/${id}`, data).then((r) => r.data),
  duplicate: (id: string) => api.post(`/quotes/${id}/duplicate`).then((r) => r.data),
  remove: (id: string) => api.delete(`/quotes/${id}`),
  generatePdf: (id: string) => api.post(`/quotes/${id}/pdf`).then((r) => r.data),
};

export const activitiesApi = {
  listByClient: (clientId: string) => api.get(`/activities/cliente/${clientId}`).then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post('/activities', data).then((r) => r.data),
  remove: (id: string) => api.delete(`/activities/${id}`),
};

export const remindersApi = {
  list: (status?: string) => api.get('/reminders', { params: { status } }).then((r) => r.data),
  today: () => api.get('/reminders/hoy').then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post('/reminders', data).then((r) => r.data),
  createQuick: (data: Record<string, unknown>) => api.post('/reminders/rapido', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/reminders/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/reminders/${id}`),
};

export const notificationsApi = {
  list: (unread = false) => api.get('/notifications', { params: { unread } }).then((r) => r.data),
  markAsRead: (id: string) => api.post(`/notifications/${id}/leida`).then((r) => r.data),
  markAllAsRead: () => api.post('/notifications/marcar-todas-leidas'),
};

export const dashboardApi = {
  summary: () => api.get('/dashboard/resumen').then((r) => r.data),
  charts: (months = 6) => api.get('/dashboard/graficos', { params: { months } }).then((r) => r.data),
};

export const aiApi = {
  draftQuote: (clientNeedDescription: string) =>
    api.post('/ai/draft-cotizacion', { clientNeedDescription }).then((r) => r.data),
};

export const usersApi = {
  list: () => api.get('/users').then((r) => r.data),
  create: (data: Record<string, unknown>) => api.post('/users', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/users/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/users/${id}`),
};
