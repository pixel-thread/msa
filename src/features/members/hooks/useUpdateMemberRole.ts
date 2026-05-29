import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';

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
        return http.post(`/members/${memberId}/role`, { role });
      }
      return http.put(`/members/${memberId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}
