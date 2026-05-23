import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import type { ApiResponse } from "@src/shared/utils/http";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
}

export function useAssociationAdmins() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["association-admins"],
    queryFn: async () => http.get<AdminUser[]>("/dsar/admins"),
  });

  return {
    admins:
      ((data as ApiResponse<AdminUser[]>)?.data as AdminUser[]) ?? [],
    isLoading,
    error,
  };
}
