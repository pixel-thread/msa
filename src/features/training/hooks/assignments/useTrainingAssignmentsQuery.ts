import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { trainingEndpoints, trainingQueryKeys } from "../../utils/constants";
import type { TrainingAssignment } from "../../types";

export function useTrainingAssignmentsQuery(moduleId: string | null) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: trainingQueryKeys.assignments.all(moduleId),
    queryFn: async () =>
      http.get<TrainingAssignment[]>(
        trainingEndpoints.assignments.base(moduleId!),
      ),
    enabled: !!moduleId,
    select: (res) => res.data,
  });

  return {
    assignments: data ?? [],
    isLoading,
    refetch,
  };
}
