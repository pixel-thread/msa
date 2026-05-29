'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { ProviderResponse } from '../types';
import { paymentEndpoints } from '../utils/constants/endpoints';

export function usePaymentProviders() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payment-providers'],
    queryFn: () => http.get<ProviderResponse[]>(paymentEndpoints.providers),
  });

  return {
    providers: data?.data ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function useProviderDetail(providerId: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payment-provider', providerId],
    queryFn: () => http.get<ProviderResponse>(paymentEndpoints.providerById(providerId!)),
    enabled: !!providerId,
  });

  return {
    provider: data?.data ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useCreateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      provider: string;
      keyId: string;
      keySecret: string;
      webhookSecret?: string;
      isActive?: boolean;
    }) => http.post(paymentEndpoints.providers, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
    },
  });
}

export function useUpdateProvider(providerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      keyId?: string;
      keySecret?: string;
      webhookSecret?: string;
      isActive?: boolean;
    }) => http.patch(paymentEndpoints.providerById(providerId), input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
      queryClient.invalidateQueries({
        queryKey: ['payment-provider', providerId],
      });
    },
  });
}

export function useDeleteProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (providerId: string) => http.delete(paymentEndpoints.providerById(providerId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
    },
  });
}
