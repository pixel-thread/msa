import { useUpdateMemberStatus } from "./useUpdateMemberStatus";
import { useUpdateMemberRole } from "./useUpdateMemberRole";

export function useMemberTableActions() {
  const updateStatus = useUpdateMemberStatus();
  const updateRole = useUpdateMemberRole();

  return {
    onStatusChange: (memberId: string, status: string) => {
      updateStatus.mutate({ memberId, status });
    },
    onRoleChange: (memberId: string, role: string, action: "add" | "remove") => {
      updateRole.mutate({ memberId, role, action });
    },
    isPending: updateStatus.isPending || updateRole.isPending,
  };
}
