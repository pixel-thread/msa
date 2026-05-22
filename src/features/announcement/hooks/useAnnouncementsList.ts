import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import type { Announcement } from "../types";

export function useAnnouncementsList(status?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["announcements-list", status],
    queryFn: async () =>
      http.get<Announcement[]>("/announcements", {
        params: status ? { status } : undefined,
      }),
    select: (data) => data.data,
  });

  return {
    announcements: data ?? [],
    isLoading,
    error,
    refetch,
  };
}
