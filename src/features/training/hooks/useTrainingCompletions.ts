import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";
import type { TrainingCompletionItem } from "../types";
import type { AdminRecordCompletionInput, RecordCompletionInput } from "../validators/training";

export function useAdminCompletions(options: { page?: number; moduleId?: string; userId?: string } = {}) {
  const { page = 1, moduleId = "", userId = "" } = options;
  const queryClient = useQueryClient();

  const queryKey = ["admin-training-completions", page, moduleId, userId];

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      let url = `/training/completions?page=${page}`;
      if (moduleId) url += `&moduleId=${moduleId}`;
      if (userId) url += `&userId=${userId}`;
      return http.get<TrainingCompletionItem[]>(url);
    },
  });

  const recordAdminCompletionMutation = useMutation({
    mutationFn: (data: AdminRecordCompletionInput) =>
      http.post<TrainingCompletionItem>("/training/completions", data),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-training-completions"] });
        queryClient.invalidateQueries({ queryKey: ["my-training-completions"] });
        toast.success("Completion recorded successfully");
        return res;
      }
      toast.error(res.message || "Failed to record completion");
      return res;
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to record completion");
    },
  });

  return {
    completions: data?.data ?? [],
    pagination: data?.meta,
    isLoading,
    recordAdminCompletion: recordAdminCompletionMutation.mutate,
    isRecording: recordAdminCompletionMutation.isPending,
    refetch,
  };
}

export function useMyCompletions(options: { page?: number; limit?: number } = {}) {
  const { page = 1, limit = 10 } = options;
  const queryClient = useQueryClient();

  const queryKey = ["my-training-completions", page, limit];

  const {
    data,
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => http.get<TrainingCompletionItem[]>(`/training/my-completions?page=${page}&limit=${limit}`),
  });

  const recordSelfCompletionMutation = useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: RecordCompletionInput }) =>
      http.post(`/training/modules/${moduleId}/complete`, data),
    onSuccess: (res, variables) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["my-training-completions"] });
        queryClient.invalidateQueries({ queryKey: ["training-modules"] });
        toast.success("Training module marked as complete!");
        return res;
      }
      toast.error(res.message || "Failed to complete training");
      return res;
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to complete training");
    },
  });

  return {
    completions: data?.data ?? [],
    pagination: data?.meta,
    isLoading,
    recordSelfCompletion: recordSelfCompletionMutation.mutate,
    isCompleting: recordSelfCompletionMutation.isPending,
    refetch,
  };
}
