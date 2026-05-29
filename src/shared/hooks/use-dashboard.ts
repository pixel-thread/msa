import { useQuery } from '@tanstack/react-query';
import type { DashboardOverview } from '@feature/dashboard/services/dashboard.service';

async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const res = await fetch('/api/dashboard/overview');
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  const json = await res.json();
  return json.data;
}

export function useDashboard() {
  return useQuery<DashboardOverview>({
    queryKey: ['dashboard', 'overview'],
    queryFn: fetchDashboardOverview,
    staleTime: 60_000,
  });
}
