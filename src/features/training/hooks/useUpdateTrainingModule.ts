import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { trainingEndpoints, trainingQueryKeys } from '../utils/constants';
import type { TrainingModuleListItem } from '../types';
import type { UpdateTrainingModuleInput } from '../validators/training';

export function useUpdateTrainingModule() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: UpdateTrainingModuleInput }) =>
      http.patch<TrainingModuleListItem>(trainingEndpoints.byId(moduleId), data),
    onSuccess: (res, variables) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.modules.all(),
        });
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.modules.detail(variables.moduleId),
        });
        toast.success('Training module updated successfully');
        return res;
      }
      toast.error(res.message || 'Failed to update module');
      return res;
    },
  });

  return {
    updateModule: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
