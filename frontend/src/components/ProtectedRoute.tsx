import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { FullPageSpinner } from '@/components/ui/Spinner';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: user, isLoading, isError } = useCurrentUser();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isLoading) return <FullPageSpinner />;
  if (isError) return <Navigate to="/login" replace />;

  if (user && !user.organization.onboardingDone) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export function OnboardingRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: user, isLoading, isError } = useCurrentUser();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isLoading) return <FullPageSpinner />;
  if (isError) return <Navigate to="/login" replace />;

  if (user && user.organization.onboardingDone) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
