import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { trainingEndpoints, trainingQueryKeys } from '../utils/constants';

export function useDeleteTrainingModule() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (moduleId: string) =>
      http.delete<{ success: boolean }>(trainingEndpoints.byId(moduleId)),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.modules.all(),
        });
        toast.success('Training module deleted successfully');
        return res;
      }
      toast.error(res.message || 'Failed to delete module');
      return res;
    },
  });

  return {
    deleteModule: mutation.mutate,
    isDeleting: mutation.isPending,
  };
}
