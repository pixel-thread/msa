import { useQuery } from '@tanstack/react-query';
import http from '../utils/http';
import { useAuthStore } from '../stores';
import { Association } from '@src/features/associations/types/association';

export function useAssociation() {
  const { isSignedIn } = useAuthStore();
  return useQuery({
    queryKey: ['associations', 'current'],
    queryFn: () => http.get<Association>('/associations/current'),
    staleTime: 60_000,
    enabled: isSignedIn,
    select: (data) => data.data,
  });
}
