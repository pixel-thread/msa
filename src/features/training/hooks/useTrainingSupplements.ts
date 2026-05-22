import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";
import type { UpdateSupplementInput } from "../validators/training";
import type { TrainingSupplementItem } from "../types";

export function useTrainingSupplements(moduleId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["training-supplements", moduleId],
    queryFn: async () =>
      http.get<TrainingSupplementItem[]>(
        `/training/modules/${moduleId}/supplements`,
      ),
    enabled: !!moduleId,
    select: (res) => res.data ?? [],
  });

  const useCreateTrainingSupplement = useMutation({
    mutationFn: (formData: FormData) =>
      http.post(`/training/modules/${moduleId}/supplements`, formData, {
        headers: { "Content-Type": undefined },
      }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: ["training-supplements", moduleId],
        });
        toast.success("Supplement added successfully");
        return res;
      }
      toast.error(res.message || "Failed to add supplement");
      return res;
    },
  });

  const useUpdateTrainingSupplement = useMutation({
    mutationFn: ({
      supplementId,
      data,
    }: {
      supplementId: string;
      data: UpdateSupplementInput | FormData;
    }) =>
      http.patch(
        `/training/modules/${moduleId}/supplements/${supplementId}`,
        data,
        {
          headers:
            data instanceof FormData
              ? { "Content-Type": undefined }
              : undefined,
        },
      ),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: ["training-supplements", moduleId],
        });
        toast.success("Supplement updated successfully");
        return res;
      }
      toast.error(res.message || "Failed to update supplement");
      return res;
    },
  });

  const useDeleteTrainingSupplement = useMutation({
    mutationFn: (supplementId: string) =>
      http.delete(`/training/modules/${moduleId}/supplements/${supplementId}`),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: ["training-supplements", moduleId],
        });
        toast.success("Supplement deleted successfully");
        return res;
      }
      toast.error(res.message || "Failed to delete supplement");
      return res;
    },
  });

  return {
    supplements: data ?? [],
    isLoading,
    createSupplement: useCreateTrainingSupplement.mutate,
    updateSupplement: useUpdateTrainingSupplement.mutate,
    deleteSupplement: useDeleteTrainingSupplement.mutate,
    isCreating: useCreateTrainingSupplement.isPending,
    isUpdating: useUpdateTrainingSupplement.isPending,
    isDeleting: useDeleteTrainingSupplement.isPending,
    refetch,
  };
}
