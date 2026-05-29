import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { trainingEndpoints, trainingQueryKeys } from '../utils/constants';
import type { TrainingModuleListItem } from '../types';

export function useTrainingModules(options: { page?: number; isActive?: boolean } = {}) {
  const { page = 1, isActive } = options;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: trainingQueryKeys.modules.list(page, isActive),
    queryFn: async () => {
      let url = `${trainingEndpoints.base}?page=${page}`;
      if (isActive !== undefined) {
        url += `&isActive=${isActive}`;
      }
      return http.get<TrainingModuleListItem[]>(url);
    },
  });

  return {
    modules: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
  };
}

export function useTrainingModule(moduleId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: trainingQueryKeys.modules.detail(moduleId),
    queryFn: async () => http.get<TrainingModuleListItem>(trainingEndpoints.byId(moduleId!)),
    enabled: !!moduleId,
    select: (res) => res.data,
  });

  return {
    module: data,
    isLoading,
    error,
  };
}
