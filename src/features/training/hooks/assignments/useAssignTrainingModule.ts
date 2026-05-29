import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { trainingEndpoints, trainingQueryKeys } from '../../utils/constants';

export function useAssignTrainingModule(moduleId: string | null) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (userId: string) =>
      http.post(trainingEndpoints.assignments.base(moduleId!), { userId }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.assignments.all(moduleId),
        });
        toast.success('User assigned successfully');
        return res;
      }
      toast.error(res.message || 'Failed to assign user');
      return res;
    },
  });

  return {
    assignUser: mutation.mutate,
    isAssigning: mutation.isPending,
  };
}
