import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { trainingEndpoints, trainingQueryKeys } from '../../utils/constants';

export function useCreateTrainingSupplement(moduleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      http.post(trainingEndpoints.supplements.list(moduleId!), formData),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.supplements.all(moduleId),
        });
        toast.success(res.message);
        return res;
      }
      toast.error(res.message || 'Failed to add supplement');
      return res;
    },
  });
}
