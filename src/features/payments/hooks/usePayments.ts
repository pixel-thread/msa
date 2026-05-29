import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { PaymentTransaction } from '../types';
import { paymentEndpoints } from '../utils/constants/endpoints';

interface UsePaymentsOptions {
  page?: number;
  userId?: string;
  status?: string;
  method?: string;
  gateway?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export function usePayments(options: UsePaymentsOptions = {}) {
  const { page = 1, userId, status, method, gateway, search, startDate, endDate } = options;

  const params = new URLSearchParams();
  params.set('page', String(page));
  if (userId) params.set('userId', userId);
  if (status) params.set('status', status);
  if (method) params.set('method', method);
  if (gateway) params.set('gateway', gateway);
  if (search) params.set('search', search);
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['all-payments', params.toString()],
    queryFn: () => http.get<PaymentTransaction[]>(`${paymentEndpoints.base}?${params.toString()}`),
  });

  return {
    payments: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
  };
}
