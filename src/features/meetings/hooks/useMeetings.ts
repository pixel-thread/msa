import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import type { Meeting, Attendee } from '../types';
import type { CreateMeetingInput } from '../validators';
import type { PaginationMeta } from '@src/shared/types/api.types';
import { meetingsEndpoints } from '../utils/constants/endpoints';

interface UseMeetingsOptions {
  page?: number;
}

export function useMeetings(options: UseMeetingsOptions = {}) {
  const { page = 1 } = options;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['meetings', page],
    queryFn: async () => http.get<Meeting[]>(meetingsEndpoints.list(page)),
  });

  const createMeetingMutation = useMutation({
    mutationFn: (data: CreateMeetingInput) => http.post<Meeting>(meetingsEndpoints.base, data),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        toast.success('Meeting created successfully');
        return data;
      }
      toast.error(data.message);
      return data;
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      const res = await http.delete(meetingsEndpoints.byId(meetingId));
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting deleted successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete meeting');
    },
  });

  return {
    meetings: data?.data ?? [],
    meta: data?.meta as PaginationMeta | undefined,
    isLoading,
    error,
    createMeeting: createMeetingMutation.mutate,
    deleteMeeting: deleteMeetingMutation.mutate,
    isCreating: createMeetingMutation.isPending,
    isDeleting: deleteMeetingMutation.isPending,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  };
}

export function useMeetingAttendees(meetingId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['meeting-attendees', meetingId],
    enabled: !!meetingId,
    queryFn: async () =>
      http.get<Attendee[]>(meetingsEndpoints.attendees.base(meetingId as string)),
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
      http.post(meetingsEndpoints.attendees.base(meetingId), {
        userId,
        attendeeRole,
      }),
    onSuccess: (data) => {
      if (data.success) {
        refetch();
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        toast.success('Attendee added successfully');
        return data;
      }
      toast.error(data.message);
      return data;
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add attendee');
    },
  });

  const removeAttendeeMutation = useMutation({
    mutationFn: async ({ meetingId, userId }: { meetingId: string; userId: string }) =>
      http.delete(meetingsEndpoints.attendees.byId(meetingId, userId)),
    onSuccess: (data) => {
      if (data.success) {
        refetch();
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        toast.success('Attendee removed successfully');
        return data;
      }
      toast.error(data.message);
      return data;
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to remove attendee');
    },
  });

  return {
    attendees: data ?? [],
    isLoading: isLoading || isFetching,
    refetch,
    addAttendee: addAttendeeMutation.mutate,
    removeAttendee: removeAttendeeMutation.mutate,
    isAdding: addAttendeeMutation.isPending,
    isRemoving: removeAttendeeMutation.isPending,
  };
}
