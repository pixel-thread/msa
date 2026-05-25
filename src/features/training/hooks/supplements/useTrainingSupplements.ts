import http from "@src/shared/utils/http";
import { useQuery } from "@tanstack/react-query";
import { trainingEndpoints, trainingQueryKeys } from "../../utils/constants";
import { TrainingSupplementItem } from "../../types";

export function useTrainingSupplements(moduleId: string) {
  const query= useQuery({
    queryKey: trainingQueryKeys.supplements.all(moduleId),
    queryFn: async () =>
      http.get<TrainingSupplementItem[]>(
        trainingEndpoints.supplements.list(moduleId),
      ),
  });

  const data=query?.data?.data
  const meta=query?.data?.meta
  return { 
  ...query,
  data:data,
  meta:meta
  }
}


