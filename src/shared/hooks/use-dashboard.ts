import { useQuery } from '@tanstack/react-query';
import http from '../utils/http';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: () => http.get('/dashboard/overview'),
    select: (data) => data.data,
    staleTime: 60_000,
  });
}
