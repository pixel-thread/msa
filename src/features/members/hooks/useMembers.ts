import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { Members } from "../types";
import { UserStatus } from "@prisma/client";

interface UseMembersOptions {
  page?: number;
  status?: UserStatus;
}

export function useMembers(options: UseMembersOptions = {}) {
  const { page = 1, status = "ACTIVE" } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["members", page, status],
    queryFn: () =>
      http.get<Members[]>(`/members?page=${page}&status=${status}`),
  });

  return {
    members: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
  };
}
