import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import type { ConsentReceiptRecord } from "../types/consent.types";
import type { ApiResponse } from "@src/shared/utils/http";

export function useUserConsentHistory(userId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["consent-history", userId],
    queryFn: async () =>
      http.get<ConsentReceiptRecord[]>(`/consent/users/${userId}`),
    enabled: !!userId,
  });

  return {
    records:
      ((data as ApiResponse<ConsentReceiptRecord[]>)
        ?.data as ConsentReceiptRecord[]) ?? [],
    isLoading,
    error,
  };
}
