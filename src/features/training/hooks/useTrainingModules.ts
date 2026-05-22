import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import type { TrainingModuleListItem } from "../types";

export function useTrainingModules(
  options: { page?: number; isActive?: boolean } = {},
) {
  const { page = 1, isActive } = options;

  const queryKey = ["training-modules", page, isActive];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      let url = `/training/modules?page=${page}`;
      if (isActive !== undefined) {
        url += `&isActive=${isActive}`;
      }
      return http.get<TrainingModuleListItem[]>(url);
    },
  });

  return {
    modules: data?.data ?? [],
    pagination: data?.meta,
    isLoading,
    error,
    refetch,
  };
}

export function useTrainingModule(moduleId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["training-module", moduleId],
    queryFn: async () =>
      http.get<TrainingModuleListItem>(`/training/modules/${moduleId}`),
    enabled: !!moduleId,
    select: (res) => res.data,
  });

  return {
    module: data,
    isLoading,
    error,
  };
}
