import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { membershipApplicationEndpoints } from '../utils/constants/endpoints';

interface RejectApplicationData {
  applicationId: string;
  rejectionReason: string;
}

export function useRejectApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RejectApplicationData) =>
      http.post(membershipApplicationEndpoints.reject(data.applicationId), {
        rejectionReason: data.rejectionReason,
      }),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message);
        queryClient.invalidateQueries({
          queryKey: ['membership-applications'],
        });
        return;
      }
      toast.error(response.message);
      return;
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to reject application');
      return;
    },
  });
}
