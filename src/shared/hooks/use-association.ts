import { useQuery } from "@tanstack/react-query";
import http from "../utils/http";
import { Association } from "@prisma/client";
import { useAuthStore } from "../stores";

export function useAssociation() {
  const { isSignedIn } = useAuthStore();
  return useQuery({
    queryKey: ["association"],
    queryFn: () => http.get<Association>("/associations"),
    staleTime: 60_000,
    enabled: isSignedIn,
    select: (data) => data.data,
  });
}
