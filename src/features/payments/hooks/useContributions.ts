import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { ContributionPeriod } from '../types';
import { paymentEndpoints } from '../utils/constants/endpoints';

interface UseContributionsOptions {
  page?: number;
  status?: string;
  userId?: string;
  year?: number;
  month?: number;
}

export function useContributions(options: UseContributionsOptions = {}) {
  const { page = 1, status, userId, year, month } = options;

  const params = new URLSearchParams();
  params.set('page', String(page));
  if (status) params.set('status', status);
  if (userId) params.set('userId', userId);
  if (year) params.set('year', String(year));
  if (month) params.set('month', String(month));

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['all-contributions', params.toString()],
    queryFn: () => http.get<ContributionPeriod[]>(`${paymentEndpoints.contributions}?${params.toString()}`),
  });

  return {
    contributions: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
  };
}
