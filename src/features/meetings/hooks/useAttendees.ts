'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { meetingsEndpoints } from '../utils/constants/endpoints';

export function useAssignAttendee(meetingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, attendeeRole }: { userId: string; attendeeRole: string }) => {
      const res = await http.post(meetingsEndpoints.attendees.base(meetingId), {
        userId,
        attendeeRole,
      });
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Attendee added successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add attendee');
    },
  });
}

export function useRemoveAttendee(meetingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await http.delete(meetingsEndpoints.attendees.byId(meetingId, userId));
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Attendee removed successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to remove attendee');
    },
  });
}
