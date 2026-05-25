import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { Association } from "../types/association";

export function useAssociationsList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["associations-list"],
    queryFn: async () => http.get<Association[]>("/admin/associations"),
  });

  return {
    associations: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
  };
}
