'use client';

import { useEffect } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Button } from '@src/shared/components/ui/button';
import { Input } from '@src/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@src/shared/components/ui/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { UpdateMeetingSchema, type UpdateMeetingInput } from '../validators';
import { zodResolver } from '@hookform/resolvers/zod';

interface MeetingData {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  venue: string | null;
  description: string | null;
  agendaItems?: Array<{
    id: string;
    title: string;
    description?: string;
    order: number;
  }>;
}

interface EditMeetingDialogProps {
  meeting: MeetingData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMeetingDialog({ meeting, open, onOpenChange }: EditMeetingDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<UpdateMeetingInput>({
    resolver: zodResolver(UpdateMeetingSchema),
    defaultValues: {
      title: meeting.title,
      type: meeting.type as any,
      scheduledAt: new Date(meeting.scheduledAt),
      venue: meeting.venue || '',
      status: meeting.status as any,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: meeting.title,
        type: meeting.type as any,
        scheduledAt: new Date(meeting.scheduledAt),
        venue: meeting.venue || '',
        status: meeting.status as any,
      });
    }
  }, [open, meeting, form]);

  const updateMeetingMutation = useMutation({
    mutationFn: async (data: UpdateMeetingInput) => {
      return http.patch(`/meetings/${meeting.id}`, data);
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['meeting', meeting.id] });
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        toast.success('Meeting updated successfully');
        onOpenChange(false);
      } else {
        toast.error(data.message);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update meeting');
    },
  });

  const onSubmit: SubmitHandler<UpdateMeetingInput> = (values) => {
    const formattedData: UpdateMeetingInput = {
      ...values,
      scheduledAt: values.scheduledAt ? new Date(values.scheduledAt) : undefined,
    };

    updateMeetingMutation.mutate(formattedData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Meeting</DialogTitle>
          <DialogDescription>Update the meeting details below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Meeting title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GENERAL_MEETING">General Meeting</SelectItem>
                          <SelectItem value="EC_MEETING">EC Meeting</SelectItem>
                          <SelectItem value="SPECIAL_MEETING">Special Meeting</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex w-full flex-col">
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={
                        field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ''
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input placeholder="Meeting venue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMeetingMutation.isPending}>
                {updateMeetingMutation.isPending ? 'Updating...' : 'Update Meeting'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
