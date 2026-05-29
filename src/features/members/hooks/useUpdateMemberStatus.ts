import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';

export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, status }: { memberId: string; status: string }) => {
      return http.patch(`/members/${memberId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}
