import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { UserPaymentData } from '../types';
import { paymentEndpoints } from '../utils/constants/endpoints';

interface UseUserPaymentsOptions {
  userId: string;
  page?: number;
}

export function useUserPayments(options: UseUserPaymentsOptions) {
  const { userId, page = 1 } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user-payments', userId, page],
    queryFn: () => http.get<UserPaymentData>(paymentEndpoints.userPayments(userId, page)),
    enabled: !!userId,
  });

  return {
    user: data?.data?.user ?? null,
    transactions: data?.data?.transactions ?? [],
    summary: data?.data?.summary ?? null,
    meta: data?.meta,
    isLoading,
    error,
    refetch,
  };
}
