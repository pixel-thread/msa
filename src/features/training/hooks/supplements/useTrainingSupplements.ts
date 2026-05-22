import http from "@src/shared/utils/http";
import { useQuery } from "@tanstack/react-query";
import { trainingEndpoints, trainingQueryKeys } from "../../utils/constants";
import { TrainingSupplementItem } from "../../types";

export function useTrainingSupplements(moduleId: string) {
  return useQuery({
    queryKey: trainingQueryKeys.supplements.all(moduleId),
    queryFn: async () =>
      http.get<TrainingSupplementItem[]>(
        trainingEndpoints.supplements.list(moduleId),
      ),
    select: (res) => res.data,
  });
}
