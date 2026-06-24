export type Role = 'ADMIN' | 'VENDEDOR' | 'OPERADOR';

export type LeadSource = 'FACEBOOK' | 'MARKETPLACE' | 'INSTAGRAM' | 'GOOGLE' | 'WHATSAPP' | 'REFERIDO' | 'OTRO';

export type ClientStatus =
  | 'NUEVO'
  | 'COTIZADO'
  | 'EN_NEGOCIACION'
  | 'PENDIENTE_DOCUMENTOS'
  | 'TRABAJO_CONTRATADO'
  | 'TRABAJO_TERMINADO'
  | 'CLIENTE_PERDIDO';

export type QuoteStatus = 'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA' | 'VENCIDA';

export type ActivityType = 'LLAMADA' | 'WHATSAPP' | 'CORREO' | 'REUNION' | 'VISITA_TECNICA';
export type ActivityResult = 'POSITIVO' | 'NEUTRO' | 'NEGATIVO' | 'SIN_RESPUESTA';
export type ReminderStatus = 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  emailVerifiedAt?: string | null;
  createdAt: string;
}

export interface Branding {
  id: string;
  organizationId: string;
  responsibleName?: string | null;
  jobTitle?: string | null;
  rut?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  signatureType: 'upload' | 'drawn' | 'none';
  signatureUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  useLogoOnQuotes: boolean;
  useLogoOnReports: boolean;
  useSignatureOnQuotes: boolean;
  useSignatureOnReports: boolean;
  currency: string;
  quotePrefix: string;
  pdfFooterNote?: string | null;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  priceMonthly: string;
  priceYearly: string;
  maxUsers: number;
  maxClients: number;
  maxQuotesMo: number;
  features: Record<string, boolean>;
}

export interface Subscription {
  id: string;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  trialEndsAt?: string | null;
  plan: Plan;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  onboardingDone: boolean;
  branding?: Branding;
  subscription?: Subscription;
}

export interface Client {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  comuna?: string | null;
  city?: string | null;
  source: LeadSource;
  status: ClientStatus;
  notes?: string | null;
  createdAt: string;
  _count?: { quotes: number; activities: number };
}

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  basePrice: string;
  estimatedDays?: number | null;
  isActive: boolean;
}

export interface Quote {
  id: string;
  number: number;
  clientId: string;
  client?: Client;
  serviceId?: string | null;
  service?: Service | null;
  description: string;
  basePrice: string;
  discount: string;
  finalPrice: string;
  paymentTerms?: string | null;
  validUntil?: string | null;
  status: QuoteStatus;
  pdfUrl?: string | null;
  createdAt: string;
}

export interface Activity {
  id: string;
  clientId: string;
  type: ActivityType;
  occurredAt: string;
  comment?: string | null;
  result?: ActivityResult | null;
  user?: { id: string; fullName: string };
}

export interface Reminder {
  id: string;
  clientId?: string | null;
  client?: { id: string; fullName: string };
  title: string;
  notes?: string | null;
  dueAt: string;
  status: ReminderStatus;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardSummary {
  totalClients: number;
  newClientsThisMonth: number;
  totalQuotes: number;
  acceptedQuotes: number;
  rejectedQuotes: number;
  quotesThisMonth: number;
  conversionRate: number;
  salesThisMonth: number;
  salesThisYear: number;
}

export interface DashboardCharts {
  months: string[];
  clientsByMonth: number[];
  quotesByMonth: number[];
  salesByMonth: number[];
  conversionByMonth: number[];
  topServices: { serviceId: string | null; serviceName: string; count: number }[];
}
