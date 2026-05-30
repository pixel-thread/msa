import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import type { CreateMeetingMinuteInput, UpdateMeetingMinuteInput } from '../validators';
import { meetingsEndpoints } from '../utils/constants/endpoints';

export interface ActionItem {
  assigneeId?: string;
  task: string;
  dueDate?: string;
}

export interface MeetingMinute {
  id: string;
  meetingId: string;
  agendaPoint: string;
  decision: string;
  actionItems: ActionItem[] | null;
  recordedAt: string;
}

export function useMeetingMinutes(meetingId: string | null) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['meeting-minutes', meetingId],
    enabled: !!meetingId,
    queryFn: async () => {
      const res = await http.get<MeetingMinute[]>(
        meetingsEndpoints.minutes.base(meetingId as string),
      );
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Failed to fetch minutes');
      }
      return res.data;
    },
  });

  const createMinuteMutation = useMutation({
    mutationFn: (minuteData: CreateMeetingMinuteInput) =>
      http.post<MeetingMinute>(meetingsEndpoints.minutes.base(meetingId as string), minuteData),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: ['meeting-minutes', meetingId],
        });
        toast.success('Minute added successfully');
      } else {
        toast.error(res.message || 'Failed to add minute');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add minute');
    },
  });

  const updateMinuteMutation = useMutation({
    mutationFn: ({ minuteId, data }: { minuteId: string; data: UpdateMeetingMinuteInput }) =>
      http.patch<MeetingMinute>(
        meetingsEndpoints.minutes.byId(meetingId as string, minuteId),
        data,
      ),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: ['meeting-minutes', meetingId],
        });
        toast.success('Minute updated successfully');
      } else {
        toast.error(res.message || 'Failed to update minute');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update minute');
    },
  });

  const deleteMinuteMutation = useMutation({
    mutationFn: (minuteId: string) =>
      http.delete(meetingsEndpoints.minutes.byId(meetingId as string, minuteId)),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: ['meeting-minutes', meetingId],
        });
        toast.success('Minute deleted successfully');
      } else {
        toast.error(res.message || 'Failed to delete minute');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete minute');
    },
  });

  return {
    minutes: data ?? [],
    isLoading,
    error,
    refetch,
    createMinute: createMinuteMutation.mutate,
    updateMinute: updateMinuteMutation.mutate,
    deleteMinute: deleteMinuteMutation.mutate,
    isCreating: createMinuteMutation.isPending,
    isUpdating: updateMinuteMutation.isPending,
    isDeleting: deleteMinuteMutation.isPending,
  };
}
