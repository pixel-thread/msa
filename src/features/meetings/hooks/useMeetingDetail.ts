import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";

interface Attendee {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    membershipNumber: string | null;
  };
  rsvpStatus: string | null;
  attendeeRole: string;
}

interface AgendaItem {
  id: string;
  title: string;
  duration: number;
  order: number;
}

interface MeetingDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  scheduledAt: string;
  venue: string | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  attendees: Attendee[];
  agendaItems: AgendaItem[];
}

export function useMeetingDetail(meetingId: string) {
  const { data, isLoading, error } = useQuery<MeetingDetail>({
    queryKey: ["meeting", meetingId],
    queryFn: async () => {
      const res = await http.get<MeetingDetail>(`/meetings/${meetingId}`);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to fetch meeting");
      }
      return res.data;
    },
    enabled: !!meetingId,
  });

  return {
    meeting: data,
    isLoading,
    error,
  };
}