import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { trainingEndpoints, trainingQueryKeys } from '../../utils/constants';

export function useBulkRemoveTrainingAssignment(moduleId: string | null) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (userIds: string[]) =>
      http.patch(trainingEndpoints.assignments.base(moduleId!), { userIds }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.assignments.all(moduleId),
        });
        toast.success('User assignments removed successfully');
        return res;
      }
      toast.error(res.message || 'Failed to remove assignments');
      return res;
    },
  });

  return {
    bulkRemoveUsers: mutation.mutate,
    isBulkRemoving: mutation.isPending,
  };
}
