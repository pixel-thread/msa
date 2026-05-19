import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";

interface ApproveMemberData {
  memberId: string;
  memberTypeId: string;
  role?: string;
  dateOfJoiningGovt?: Date;
  dateOfJoiningMfsa?: Date;
}

export function useApproveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApproveMemberData) =>
      http.post(`/admin/users/${data.memberId}/approve`, data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["members"] });
        queryClient.invalidateQueries({ queryKey: ["members", "pending"] });
        return;
      }
      toast.error(data.message);
    },
  });
}
