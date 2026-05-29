import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { trainingEndpoints, trainingQueryKeys } from '../../utils/constants';

export function useBulkAssignTrainingModule(moduleId: string | null) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (userIds: string[]) =>
      http.put(trainingEndpoints.assignments.base(moduleId!), { userIds }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.assignments.all(moduleId),
        });
        toast.success('Users assigned successfully');
        return res;
      }
      toast.error(res.message || 'Failed to assign users');
      return res;
    },
  });

  return {
    bulkAssignUsers: mutation.mutate,
    isBulkAssigning: mutation.isPending,
  };
}
