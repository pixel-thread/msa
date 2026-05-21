import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";
import type { UpdateSupplementInput } from "../validators/training";

export function useTrainingSupplements(moduleId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["training-supplements", moduleId],
    queryFn: async () => http.get<any[]>(`/training/modules/${moduleId}/supplements`),
    enabled: !!moduleId,
    select: (res) => res.data ?? [],
  });

  const createSupplementMutation = useMutation({
    mutationFn: (formData: FormData) =>
      http.post<any>(`/training/modules/${moduleId}/supplements`, formData),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["training-supplements", moduleId] });
        toast.success("Supplement added successfully");
        return res;
      }
      toast.error(res.message || "Failed to add supplement");
      return res;
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to add supplement");
    },
  });

  const updateSupplementMutation = useMutation({
    mutationFn: ({ supplementId, data }: { supplementId: string; data: UpdateSupplementInput | FormData }) =>
      http.patch<any>(`/training/modules/${moduleId}/supplements/${supplementId}`, data),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["training-supplements", moduleId] });
        toast.success("Supplement updated successfully");
        return res;
      }
      toast.error(res.message || "Failed to update supplement");
      return res;
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update supplement");
    },
  });

  const deleteSupplementMutation = useMutation({
    mutationFn: (supplementId: string) =>
      http.delete<{ success: boolean }>(`/training/modules/${moduleId}/supplements/${supplementId}`),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["training-supplements", moduleId] });
        toast.success("Supplement deleted successfully");
        return res;
      }
      toast.error(res.message || "Failed to delete supplement");
      return res;
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to delete supplement");
    },
  });

  return {
    supplements: data ?? [],
    isLoading,
    createSupplement: createSupplementMutation.mutate,
    updateSupplement: updateSupplementMutation.mutate,
    deleteSupplement: deleteSupplementMutation.mutate,
    isCreating: createSupplementMutation.isPending,
    isUpdating: updateSupplementMutation.isPending,
    isDeleting: deleteSupplementMutation.isPending,
    refetch,
  };
}
