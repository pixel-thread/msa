import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";

interface MemberType {
  id: string;
  level: number;
  description: string | null;
  _count: {
    users: number;
    subscriptionPlans: number;
  };
}

export function useMemberTypesList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["member-types-list"],
    queryFn: async () => http.get<MemberType[]>("/member-types"),
    select: (data) => data.data,
  });

  return {
    memberTypes: data ?? [],
    isLoading,
    error,
    refetch,
  };
}
