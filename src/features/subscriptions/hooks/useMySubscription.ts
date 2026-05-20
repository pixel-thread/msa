import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { Subscription } from "../types";

export function useMySubscription(page: number = 1) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-subscription", page],
    queryFn: () =>
      http.get<Subscription>(`/subscriptions/my?page=${page}`),
  });

  return {
    subscription: data?.data ?? null,
    meta: data?.meta,
    isLoading,
    error,
    refetch,
  };
}
