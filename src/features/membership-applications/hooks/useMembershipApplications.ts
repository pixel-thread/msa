import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { MembershipApplicationListItem } from '../types';
import { membershipApplicationEndpoints } from '../utils/constants/endpoints';

interface ApplicationsResponse {
  data: MembershipApplicationListItem[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
}

interface UseMembershipApplicationsOptions {
  page?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export function useMembershipApplications(options: UseMembershipApplicationsOptions = {}) {
  const { page = 1, status } = options;
  const params = new URLSearchParams();
  params.set('page', String(page));
  const url = `${membershipApplicationEndpoints.base}?${params.toString()}`;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['membership-applications', page, status],
    queryFn: () => http.get<MembershipApplicationListItem[]>(url),
    refetchOnMount: true,
    networkMode: 'offlineFirst',
  });

  const result = data?.data;

  return {
    applications: result ?? [],
    pagination: data?.meta ?? null,
    isLoading,
    error,
    refetch,
  };
}
