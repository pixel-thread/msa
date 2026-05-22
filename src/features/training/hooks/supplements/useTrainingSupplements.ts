import http from "@src/shared/utils/http";
import { useQuery } from "@tanstack/react-query";
import { TrainingSupplementItem } from "../../types";

export function useTrainingSupplements(moduleId: string) {
  return useQuery({
    queryKey: ["training-supplements", moduleId],
    queryFn: async () =>
      http.get<TrainingSupplementItem[]>(
        `/training/modules/${moduleId}/supplements`,
      ),
    select: (res) => res.data,
  });
}
