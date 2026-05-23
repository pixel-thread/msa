import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";

export interface Association {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  country: string;
  state: string | null;
  contactEmail: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    meetings: number;
  };
}

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
