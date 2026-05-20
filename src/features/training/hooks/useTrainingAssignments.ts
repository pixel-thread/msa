import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";
import type { TrainingAssignment } from "../types";

export function useTrainingAssignments(moduleId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ["training-assignments", moduleId];

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => http.get<TrainingAssignment[]>(`/training/modules/${moduleId}/assign`),
    enabled: !!moduleId,
    select: (res) => res.data,
  });

  const assignUserMutation = useMutation({
    mutationFn: (userId: string) =>
      http.post(`/training/modules/${moduleId}/assign`, { userId }),
    onSuccess: (res) => {
      if (res.success) {
        refetch();
        toast.success("User assigned successfully");
        return res;
      }
      toast.error(res.message || "Failed to assign user");
      return res;
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to assign user");
    },
  });

  const bulkAssignUsersMutation = useMutation({
    mutationFn: (userIds: string[]) =>
      http.put(`/training/modules/${moduleId}/assign`, { userIds }),
    onSuccess: (res) => {
      if (res.success) {
        refetch();
        toast.success("Users assigned successfully");
        return res;
      }
      toast.error(res.message || "Failed to assign users");
      return res;
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to assign users");
    },
  });

  const removeUserMutation = useMutation({
    mutationFn: (userId: string) =>
      http.delete(`/training/modules/${moduleId}/assign`, { data: { userId } }),
    onSuccess: (res) => {
      if (res.success) {
        refetch();
        toast.success("User assignment removed successfully");
        return res;
      }
      toast.error(res.message || "Failed to remove assignment");
      return res;
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to remove assignment");
    },
  });

  const bulkRemoveUsersMutation = useMutation({
    mutationFn: (userIds: string[]) =>
      http.patch(`/training/modules/${moduleId}/assign`, { userIds }),
    onSuccess: (res) => {
      if (res.success) {
        refetch();
        toast.success("User assignments removed successfully");
        return res;
      }
      toast.error(res.message || "Failed to remove assignments");
      return res;
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to remove assignments");
    },
  });

  return {
    assignments: data ?? [],
    isLoading,
    assignUser: assignUserMutation.mutate,
    bulkAssignUsers: bulkAssignUsersMutation.mutate,
    removeUser: removeUserMutation.mutate,
    bulkRemoveUsers: bulkRemoveUsersMutation.mutate,
    isAssigning: assignUserMutation.isPending || bulkAssignUsersMutation.isPending,
    isRemoving: removeUserMutation.isPending || bulkRemoveUsersMutation.isPending,
    refetch,
  };
}
