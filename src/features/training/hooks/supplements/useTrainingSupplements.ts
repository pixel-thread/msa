import http from '@src/shared/utils/http';
import { useQuery } from '@tanstack/react-query';
import { trainingEndpoints, trainingQueryKeys } from '../../utils/constants';
import { TrainingSupplementItem } from '../../types';

export function useTrainingSupplements(moduleId: string, page?: number) {
  const pageNo = page ?? 1;
  const query = useQuery({
    queryKey: trainingQueryKeys.supplements.all(moduleId, pageNo),
    queryFn: async () =>
      http.get<TrainingSupplementItem[]>(trainingEndpoints.supplements.list(moduleId, pageNo)),
  });

  const data = query?.data?.data;
  const meta = query?.data?.meta;
  return {
    ...query,
    data: data,
    meta: meta,
  };
}
