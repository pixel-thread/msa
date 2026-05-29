import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { trainingEndpoints, trainingQueryKeys } from '../../utils/constants';
import type { UpdateSupplementInput } from '../../validators/training';

export function useUpdateTrainingSupplement(moduleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      supplementId,
      data,
    }: {
      supplementId: string;
      data: UpdateSupplementInput | FormData;
    }) => http.patch(trainingEndpoints.supplements.byId(moduleId!, supplementId), data),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.supplements.all(moduleId),
        });
        toast.success('Supplement updated successfully');
        return res;
      }
      toast.error(res.message || 'Failed to update supplement');
      return res;
    },
  });
}
