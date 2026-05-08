import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";

interface MemberDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  membershipNumber: string | null;
  designation: string | null;
  mobile: string | null;
  dateOfJoiningGovt: string | null;
  dateOfJoiningMfsa: string | null;
  createdAt: string;
  updatedAt: string;
  hasPaid: boolean;
  lastPaymentDate: string | null;
  _count: {
    payments: number;
    meetingAttendances: number;
  };
}

export function useMemberDetail(memberId: string) {
  const { data, isLoading, error } = useQuery<MemberDetail>({
    queryKey: ["member", memberId],
    queryFn: async () => {
      const res = await http.get<MemberDetail>(`/members/${memberId}`);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to fetch member");
      }
      return res.data;
    },
    enabled: !!memberId,
  });

  return {
    member: data,
    isLoading,
    error,
  };
}