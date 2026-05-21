import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";
import type { TrainingModuleListItem } from "../types";
import type { CreateTrainingModuleInput, UpdateTrainingModuleInput } from "../validators/training";

export function useTrainingModules(options: { page?: number; isActive?: boolean } = {}) {
  const { page = 1, isActive } = options;
  const queryClient = useQueryClient();

  const queryKey = ["training-modules", page, isActive];

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      let url = `/training/modules?page=${page}`;
      if (isActive !== undefined) {
        url += `&isActive=${isActive}`;
      }
      return http.get<TrainingModuleListItem[]>(url);
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: (data: CreateTrainingModuleInput) =>
      http.post<TrainingModuleListItem>("/training/modules", data),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["training-modules"] });
        toast.success("Training module created successfully");
        return res;
      }
      toast.error(res.message || "Failed to create module");
      return res;
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create module");
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: UpdateTrainingModuleInput }) =>
      http.patch<TrainingModuleListItem>(`/training/modules/${moduleId}`, data),
    onSuccess: (res, variables) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["training-modules"] });
        queryClient.invalidateQueries({ queryKey: ["training-module", variables.moduleId] });
        toast.success("Training module updated successfully");
        return res;
      }
      toast.error(res.message || "Failed to update module");
      return res;
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update module");
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) =>
      http.delete<{ success: boolean }>(`/training/modules/${moduleId}`),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["training-modules"] });
        toast.success("Training module deleted successfully");
        return res;
      }
      toast.error(res.message || "Failed to delete module");
      return res;
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete module");
    },
  });

  return {
    modules: data?.data ?? [],
    pagination: data?.meta,
    isLoading,
    error,
    createModule: createModuleMutation.mutate,
    updateModule: updateModuleMutation.mutate,
    deleteModule: deleteModuleMutation.mutate,
    isCreating: createModuleMutation.isPending,
    isUpdating: updateModuleMutation.isPending,
    isDeleting: deleteModuleMutation.isPending,
    refetch,
  };
}

export function useTrainingModule(moduleId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["training-module", moduleId],
    queryFn: async () => http.get<TrainingModuleListItem>(`/training/modules/${moduleId}`),
    enabled: !!moduleId,
    select: (res) => res.data,
  });

  return {
    module: data,
    isLoading,
    error,
  };
}
