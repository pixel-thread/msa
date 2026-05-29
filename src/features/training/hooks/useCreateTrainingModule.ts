import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { trainingEndpoints, trainingQueryKeys } from '../utils/constants';
import type { TrainingModuleListItem } from '../types';
import type { CreateTrainingModuleInput } from '../validators/training';

export function useCreateTrainingModule() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreateTrainingModuleInput) =>
      http.post<TrainingModuleListItem>(trainingEndpoints.base, data),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.modules.all(),
        });
        toast.success('Training module created successfully');
        return res;
      }
      toast.error(res.message || 'Failed to create module');
      return res;
    },
  });

  return {
    createModule: mutation.mutate,
    isCreating: mutation.isPending,
  };
}
