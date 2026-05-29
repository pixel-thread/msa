import http from '@src/shared/utils/http';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { membersEndpoints } from '../utils/constants/endpoints';

interface RejectMemberData {
  applicationId: string;
  rejectionReason?: string;
}

export function useRejectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, rejectionReason }: RejectMemberData) => {
      return http.post(membersEndpoints.applications.reject(applicationId), {
        rejectionReason: rejectionReason || 'Application rejected by admin',
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({
          queryKey: ['membership-applications'],
        });
        return;
      }
      toast.error(data.message);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to reject application');
    },
  });
}
