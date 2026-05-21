import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import type { Announcement } from "../types";

export function useAnnouncementsList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["announcements-list"],
    queryFn: async () => http.get<Announcement[]>("/announcement"),
    select: (data) => data.data,
  });

  return {
    announcements: data ?? [],
    isLoading,
    error,
    refetch,
  };
}
