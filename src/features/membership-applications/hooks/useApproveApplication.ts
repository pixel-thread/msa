import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";

interface ApproveApplicationData {
  applicationId: string;
  memberTypeId: string;
  role?: string;
  dateOfJoiningGovt?: Date;
}

export function useApproveApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApproveApplicationData) =>
      http.post(
        `/admin/membership-applications/${data.applicationId}/approve`,
        {
          memberTypeId: data.memberTypeId,
          role: data.role,
          dateOfJoiningGovt: data.dateOfJoiningGovt,
        },
      ),
    onSuccess: (response) => {
      if (response.success) {
        toast.success(response.message);
        queryClient.invalidateQueries({
          queryKey: ["membership-applications"],
        });
        queryClient.invalidateQueries({ queryKey: ["members"] });
        return;
      }
      toast.error(response.message);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to approve application");
    },
  });
}
