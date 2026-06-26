import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy } from 'react';

import { ProtectedRoute, OnboardingRoute, GuestRoute } from '@/components/ProtectedRoute';
import MainLayout from '@/layouts/MainLayout';
import { FullPageSpinner } from '@/components/ui/Spinner';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const OnboardingWizard = lazy(() => import('@/pages/onboarding/OnboardingWizard'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const ClientsListPage = lazy(() => import('@/pages/clients/ClientsListPage'));
const ClientDetailPage = lazy(() => import('@/pages/clients/ClientDetailPage'));
const QuotesListPage = lazy(() => import('@/pages/quotes/QuotesListPage'));
const QuoteFormPage = lazy(() => import('@/pages/quotes/QuoteFormPage'));
const QuoteDetailPage = lazy(() => import('@/pages/quotes/QuoteDetailPage'));
const ServicesPage = lazy(() => import('@/pages/services/ServicesPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Suspense fallback={<FullPageSpinner />}>
          <Routes>
            {/* Rutas públicas */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/recuperar-password" element={<ForgotPasswordPage />} />
              <Route path="/restablecer-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Onboarding (autenticado, sin onboarding completo) */}
            <Route element={<OnboardingRoute />}>
              <Route path="/onboarding" element={<OnboardingWizard />} />
            </Route>

            {/* App principal (autenticado, onboarding completo) */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/clientes" element={<ClientsListPage />} />
                <Route path="/clientes/:id" element={<ClientDetailPage />} />
                <Route path="/cotizaciones" element={<QuotesListPage />} />
                <Route path="/cotizaciones/nueva" element={<QuoteFormPage />} />
                <Route path="/cotizaciones/:id/editar" element={<QuoteFormPage />} />
                <Route path="/cotizaciones/:id" element={<QuoteDetailPage />} />
                <Route path="/servicios" element={<ServicesPage />} />
                <Route path="/configuracion" element={<SettingsPage />} />
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
