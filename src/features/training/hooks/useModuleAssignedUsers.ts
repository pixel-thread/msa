import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";
import { trainingEndpoints, trainingQueryKeys } from "../utils/constants";
import type { AssignedUserWithCompletion } from "../types";

export function useModuleAssignedUsers(moduleId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: trainingQueryKeys.assignedUsers.all(moduleId),
    queryFn: async () =>
      http.get<AssignedUserWithCompletion[]>(
        trainingEndpoints.assignedUsers.list(moduleId!),
      ),
    enabled: !!moduleId,
    select: (res) => res.data,
  });

  const completeAssignmentMutation = useMutation({
    mutationFn: ({
      userId,
      scorePercent,
    }: {
      userId: string;
      scorePercent?: number;
    }) =>
      http.post(trainingEndpoints.assignedUsers.complete(moduleId!, userId), {
        scorePercent,
      }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.assignedUsers.base,
        });
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.completions.admin,
        });
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.completions.my,
        });
        toast.success("User marked as completed successfully");
        return res;
      }
      toast.error(res.message || "Failed to mark as completed");
      return res;
    },
  });

  return {
    assignedUsers: data ?? [],
    isLoading,
    completeAssignment: completeAssignmentMutation.mutate,
    isCompleting: completeAssignmentMutation.isPending,
    refetch,
  };
}
