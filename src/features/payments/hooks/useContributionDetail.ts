"use client";

import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { ContributionPeriod } from "../types";

export function useContributionDetail(contributionId: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["contribution-detail", contributionId],
    queryFn: () =>
      http.get<ContributionPeriod>(`/payments/contributions/${contributionId}`),
    enabled: !!contributionId,
  });

  return {
    contribution: data?.data ?? null,
    isLoading,
    error,
    refetch,
  };
}
