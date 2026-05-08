import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";
import type { Meeting, Member, Attendee, CreateMeetingForm } from "../types";

interface UseMeetingsOptions {
  limit?: number;
}

export function useMeetings(options: UseMeetingsOptions = {}) {
  const { limit = 50 } = options;
  const queryClient = useQueryClient();

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => http.get<Meeting[]>(`/meetings?limit=${limit}`),
    select: (data) => data.data,
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (formData: CreateMeetingForm) => {
      const agendaItems = formData.agendaItems
        ? formData.agendaItems
            .split("\n")
            .filter(Boolean)
            .map((title, index) => ({
              order: index + 1,
              title: title.trim(),
              description: undefined,
            }))
        : undefined;

      return http.post("/meetings", {
        title: formData.title,
        type: formData.type,
        scheduledAt: formData.scheduledAt,
        venue: formData.venue || undefined,
        agendaItems,
      });
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["meetings"] });
        toast.success("Meeting created successfully");
        return data;
      }
      toast.error(data.message);
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      const res = await http.delete(`/meetings/${meetingId}`);
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting deleted successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete meeting");
    },
  });

  return {
    meetings: data ?? [],
    pagination: undefined,
    isLoading,
    error,
    createMeeting: createMeetingMutation.mutate,
    deleteMeeting: deleteMeetingMutation.mutate,
    isCreating: createMeetingMutation.isPending,
    isDeleting: deleteMeetingMutation.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["meetings"] }),
  };
}

export function useMeetingAttendees(meetingId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["meeting-attendees", meetingId],
    enabled: !!meetingId,
    queryFn: async () =>
      http.get<Attendee[]>(`/meetings/${meetingId}/attendees`),
    select: (data) => data.data,
  });

  const addAttendeeMutation = useMutation({
    mutationFn: async ({
      meetingId,
      userId,
      attendeeRole,
    }: {
      meetingId: string;
      userId: string;
      attendeeRole: string;
    }) =>
      http.post(`/meetings/${meetingId}/attendees`, {
        userId,
        attendeeRole,
      }),
    onSuccess: (data) => {
      if (data.success) {
        refetch();
        queryClient.invalidateQueries({ queryKey: ["meetings"] });
        toast.success("Attendee added successfully");
        return data;
      }
      toast.error(data.message);
      return data;
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add attendee");
    },
  });

  const removeAttendeeMutation = useMutation({
    mutationFn: async ({
      meetingId,
      userId,
    }: {
      meetingId: string;
      userId: string;
    }) => http.delete(`/meetings/${meetingId}/attendees/${userId}`),
    onSuccess: (data) => {
      if (data.success) {
        refetch();
        queryClient.invalidateQueries({ queryKey: ["meetings"] });
        toast.success("Attendee removed successfully");
        return data;
      }
      toast.error(data.message);
      return data;
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to remove attendee");
    },
  });

  return {
    attendees: data ?? [],
    isLoading,
    refetch,
    addAttendee: addAttendeeMutation.mutate,
    removeAttendee: removeAttendeeMutation.mutate,
    isAdding: addAttendeeMutation.isPending,
    isRemoving: removeAttendeeMutation.isPending,
  };
}

export function useMembers() {
  const { data, isLoading } = useQuery({
    queryKey: ["members-all"],
    queryFn: async () => http.get<Member[]>("/members?limit=100"),
    select: (data) => data.data,
  });

  return {
    members: data ?? [],
    isLoading,
  };
}
