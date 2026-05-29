import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { membersEndpoints } from '../utils/constants/endpoints';

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
      http.post(membersEndpoints.applications.approve(data.applicationId), {
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
