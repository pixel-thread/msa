import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";

export function useUpdateMemberAssociation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      associationId,
    }: {
      memberId: string;
      associationId: string;
    }) => {
      return http.patch(`/members/${memberId}`, { associationId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
  });
}
