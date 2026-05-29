import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { membersEndpoints } from '../utils/constants/endpoints';

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      role,
      action,
    }: {
      memberId: string;
      role: string;
      action: 'add' | 'remove';
    }) => {
      if (action === 'add') {
        return http.post(membersEndpoints.role(memberId), { role });
      }
      return http.put(membersEndpoints.role(memberId), { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}
