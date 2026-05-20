import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";

interface UseMembershipApplicationsParams {
  status?: "PENDING" | "APPROVED" | "REJECTED";
  page?: number;
  pageSize?: number;
}

export function useMembershipApplications(params?: UseMembershipApplicationsParams) {
  const { status, page = 1, pageSize = 10 } = params || {};

  const queryParams = new URLSearchParams();
  if (status) queryParams.set("status", status);
  queryParams.set("page", page.toString());
  queryParams.set("pageSize", pageSize.toString());

  return useQuery({
    queryKey: ["membership-applications", status, page, pageSize],
    queryFn: () =>
      http.get(`/admin/membership-applications?${queryParams.toString()}`),
  });
}
