import http from "@src/shared/utils/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface RejectMemberData {
  memberId: string;
}

export function useRejectMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId }: RejectMemberData) => {
      return http.post(`/admin/users/${memberId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["members", "pending"] });
    },
  });
}
