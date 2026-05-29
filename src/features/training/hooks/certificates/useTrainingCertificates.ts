import http from '@src/shared/utils/http';
import { useQuery } from '@tanstack/react-query';
import { trainingEndpoints, trainingQueryKeys } from '../../utils/constants';
import { TrainingCertificateItem } from '../../types';

export function useTrainingCertificates(moduleId: string | null) {
  const query = useQuery({
    queryKey: trainingQueryKeys.certificates.all(moduleId),
    queryFn: async () =>
      http.get<TrainingCertificateItem[]>(trainingEndpoints.certificates.list(moduleId!)),
    enabled: !!moduleId,
  });

  return {
    certificates: query.data?.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
