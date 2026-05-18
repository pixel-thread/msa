import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import type { PaginationMeta } from "@src/shared/types";
import type { Member } from "./useMemberTableColumns";

interface UseMembersOptions {
  page?: number;
}

export function useMembers(options: UseMembersOptions = {}) {
  const { page = 1 } = options;

  const { data, isLoading, error, refetch } = useQuery<{
    data: Member[];
    meta: PaginationMeta;
  }>({
    queryKey: ["members", page],
    queryFn: async () => {
      const res = await http.get<Member[]>(`/members?page=${page}`);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch members");
      }
      return {
        data: res.data ?? [],
        meta: res.meta!,
      };
    },
  });

  return {
    members: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
  };
}
