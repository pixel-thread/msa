import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";
import type { AssignedUserWithCompletion } from "../types";

export function useModuleAssignedUsers(moduleId: string | null) {
  const queryClient = useQueryClient();

  const queryKey = ["module-assigned-users", moduleId];

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () =>
      http.get<AssignedUserWithCompletion[]>(`/training/modules/${moduleId}/assigned-users`),
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
      http.post(`/training/modules/${moduleId}/assignments/${userId}/complete`, {
        scorePercent,
      }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["module-assigned-users"] });
        queryClient.invalidateQueries({ queryKey: ["admin-training-completions"] });
        queryClient.invalidateQueries({ queryKey: ["my-training-completions"] });
        toast.success("User marked as completed successfully");
        return res;
      }
      toast.error(res.message || "Failed to mark as completed");
      return res;
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to mark as completed");
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
