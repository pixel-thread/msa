import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';

interface ApproveMemberData {
  applicationId: string;
  memberTypeId: string;
  role?: string;
  dateOfJoiningGovt?: Date;
}

export function useApproveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApproveMemberData) =>
      http.post(`/admin/membership-applications/${data.applicationId}/approve`, {
        memberTypeId: data.memberTypeId,
        role: data.role,
        dateOfJoiningGovt: data.dateOfJoiningGovt,
      }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ['members'] });
        queryClient.invalidateQueries({
          queryKey: ['membership-applications'],
        });
        return;
      }
      toast.error(data.message);
    },
  });
}
