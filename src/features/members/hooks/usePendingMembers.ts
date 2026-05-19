import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import type { PaginationMeta } from "@src/shared/types";
import type { Member } from "./useMemberTableColumns";

interface UsePendingMembersOptions {
  page?: number;
}

export function usePendingMembers(options: UsePendingMembersOptions = {}) {
  const { page = 1 } = options;

  const { data, isLoading, error, refetch } = useQuery<{
    data: Member[];
    meta: PaginationMeta;
  }>({
    queryKey: ["members", "pending", page],
    queryFn: async () => {
      const res = await http.get<Member[]>(`/members?status=PENDING&page=${page}`);
      if (!res.success) {
        throw new Error(res.message || "Failed to fetch pending members");
      }
      return {
        data: res.data ?? [],
        meta: res.meta!,
      };
    },
  });

  return {
    pendingMembers: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
  };
}
