import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { trainingEndpoints, trainingQueryKeys } from '../../utils/constants';

export function useDeleteTrainingCertificate(moduleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (certificateId: string) =>
      http.delete(trainingEndpoints.certificates.byId(moduleId!, certificateId)),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.certificates.all(moduleId),
        });
        toast.success('Certificate deleted successfully');
        return res;
      }
      toast.error(res.message || 'Failed to delete certificate');
      return res;
    },
  });
}
