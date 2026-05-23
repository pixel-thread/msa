import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { Association } from "../types/association";

export function useAssociationsList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["associations-list"],
    queryFn: async () => http.get<Association[]>("/associations"),
    select: (data) => data.data,
  });

  return {
    associations: data ?? [],
    isLoading,
    error,
    refetch,
  };
}
