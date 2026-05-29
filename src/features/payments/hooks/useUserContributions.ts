import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { UserContributionData } from '../types';
import { paymentEndpoints } from '../utils/constants/endpoints';

interface UseUserContributionsOptions {
  userId: string;
  fromYear?: number;
  fromMonth?: number;
  toYear?: number;
  toMonth?: number;
}

export function useUserContributions(options: UseUserContributionsOptions) {
  const { userId, fromYear, fromMonth, toYear, toMonth } = options;

  const params = new URLSearchParams();
  if (fromYear) params.set('fromYear', String(fromYear));
  if (fromMonth) params.set('fromMonth', String(fromMonth));
  if (toYear) params.set('toYear', String(toYear));
  if (toMonth) params.set('toMonth', String(toMonth));

  const queryString = params.toString();
  const url = `${paymentEndpoints.userContributions(userId)}${queryString ? `?${queryString}` : ''}`;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-contributions', userId, queryString],
    queryFn: () => http.get<UserContributionData>(url),
    enabled: !!userId,
  });

  return {
    user: data?.data?.user ?? null,
    contributions: data?.data?.contributions ?? [],
    summary: data?.data?.summary ?? null,
    isLoading,
    error,
    refetch,
  };
}
