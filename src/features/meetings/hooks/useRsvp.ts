'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import type { RsvpForm } from '../types';
import { meetingsEndpoints } from '../utils/constants/endpoints';

export function useRsvp() {
  const queryClient = useQueryClient();
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [rsvpForm, setRsvpForm] = useState<RsvpForm>({
    status: 'ACCEPTED',
    note: '',
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({
      meetingId,
      formData,
    }: {
      meetingId: string;
      formData: RsvpForm;
      userId?: string;
    }) =>
      http.patch(meetingsEndpoints.rsvp(meetingId), {
        rsvpStatus: formData.status,
        rsvpNote: formData.note,
      }),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        setRsvpDialogOpen(false);
        setRsvpForm({ status: 'ACCEPTED', note: '' });
        setSelectedMeetingId(null);
        toast.success(data.message);
        return data;
      }
      toast.error(data.message);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to submit RSVP');
    },
  });

  const openRsvpDialog = (meetingId: string, status: 'ACCEPTED' | 'DECLINED' = 'ACCEPTED') => {
    setSelectedMeetingId(meetingId);
    setRsvpForm({ status, note: '' });
    setRsvpDialogOpen(true);
  };

  const closeRsvpDialog = () => {
    setRsvpDialogOpen(false);
    setRsvpForm({ status: 'ACCEPTED', note: '' });
    setSelectedMeetingId(null);
  };

  const submitRsvp = () => {
    if (!selectedMeetingId) return;
    rsvpMutation.mutate({
      meetingId: selectedMeetingId,
      formData: rsvpForm,
    });
  };
  return {
    rsvpDialogOpen,
    setRsvpDialogOpen,
    selectedMeetingId,
    rsvpForm,
    setRsvpForm,
    openRsvpDialog,
    closeRsvpDialog,
    submitRsvp,
    isPending: rsvpMutation.isPending,
    accept: (meetingId: string) => {
      rsvpMutation.mutate({
        meetingId,
        formData: { status: 'ACCEPTED' },
      });
    },
    decline: (meetingId: string) => {
      openRsvpDialog(meetingId, 'DECLINED');
    },
  };
}
