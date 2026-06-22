import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { User, Organization } from '@/types';

interface MeResponse extends User {
  organization: Organization;
}

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: authApi.me,
    enabled: isAuthenticated,
    retry: false,
    staleTime: 60_000,
  });

  return query;
}
