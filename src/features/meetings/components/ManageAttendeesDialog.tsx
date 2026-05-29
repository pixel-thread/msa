'use client';

import {
  CheckIcon as Check,
  ClockIcon as Clock,
  UserIcon as Users,
  XIcon,
} from '@phosphor-icons/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { Button } from '@src/shared/components/ui/button';
import { Avatar, AvatarFallback } from '@src/shared/components/ui/avatar';
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
import { cn } from '@src/shared/lib/utils';
import type { Attendee } from '../types';
import { AssignAttendeeSchema, type AssignAttendeeInput } from '../validators';
import { MemberListItem } from '@src/features/members/types';

interface ManageAttendeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: { id: string; title: string } | null;
  members: MemberListItem[];
  attendees: Attendee[];
  onAddAttendee: (data: AssignAttendeeInput) => void;
  onRemoveAttendee: (userId: string) => void;
  isAdding: boolean;
  isRemoving: boolean;
}

function RsvpStatusBadge({ status }: { status: string | undefined }) {
  const getStatusConfig = (status: string | undefined) => {
    switch (status?.toUpperCase()) {
      case 'ACCEPTED':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/30',
          border: 'border-emerald-200 dark:border-emerald-800',
          text: 'text-emerald-700 dark:text-emerald-400',
          icon: <Check className="h-3 w-3" />,
          label: 'Accepted',
        };
      case 'DECLINED':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-400',
          icon: <XIcon className="h-3 w-3" />,
          label: 'Declined',
        };
      default:
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30',
          border: 'border-amber-200 dark:border-amber-800',
          text: 'text-amber-700 dark:text-amber-400',
          icon: <Clock className="h-3 w-3" />,
          label: 'Pending',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5  border text-xs font-medium',
        config.bg,
        config.border,
        config.text,
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}

function AttendeeCard({
  attendee,
  onRemove,
  isRemoving,
}: {
  attendee: Attendee;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'HOST':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
      case 'CO_HOST':
        return 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300';
      case 'REQUIRED':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300';
      case 'OPTIONAL':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      case 'OBSERVER':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border border-border/60 bg-card hover:bg-muted/30 transition-colors group">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="text-sm font-medium bg-muted">
            {getInitials(attendee.user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{attendee.user.name}</span>
          <span className="text-xs text-muted-foreground">{attendee.user.email}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className={cn('text-xs px-2.5 py-1  font-medium', getRoleColor(attendee.attendeeRole))}
          >
            {attendee.attendeeRole}
          </span>
        </div>
        <RsvpStatusBadge status={attendee.rsvpStatus} />
        <Button
          size="sm"
          variant="ghost"
          onClick={onRemove}
          disabled={isRemoving}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ManageAttendeesDialog({
  open,
  onOpenChange,
  meeting,
  members,
  attendees,
  onAddAttendee,
  onRemoveAttendee,
  isAdding,
  isRemoving,
}: ManageAttendeesDialogProps) {
  const form = useForm({
    resolver: zodResolver(AssignAttendeeSchema),
    defaultValues: {
      userId: '',
      attendeeRole: 'OPTIONAL',
    },
  });

  const stats = {
    total: attendees.length,
    accepted: attendees.filter((a) => a.rsvpStatus === 'ACCEPTED').length,
    declined: attendees.filter((a) => a.rsvpStatus === 'DECLINED').length,
    pending: attendees.filter((a) => a.rsvpStatus !== 'ACCEPTED' && a.rsvpStatus !== 'DECLINED')
      .length,
  };

  const onSubmit = (data: AssignAttendeeInput) => {
    onAddAttendee(data);
    form.reset({ userId: '', attendeeRole: 'OPTIONAL' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden w-200 flex flex-col p-0 max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg">Manage Attendees</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {meeting?.title || 'Select a meeting'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 bg-emerald-500" />
                <span className="text-muted-foreground">{stats.accepted} Accepted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 bg-red-500" />
                <span className="text-muted-foreground">{stats.declined} Declined</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 bg-amber-500" />
                <span className="text-muted-foreground">{stats.pending} Pending</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col w-full gap-4 p-4 border border-border/60 bg-muted/20"
            >
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Select Member</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Search and select a member..." />
                        </SelectTrigger>
                        <SelectContent>
                          {members.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex items-center gap-2">
                                <span>{member.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({member.email})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attendeeRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Role</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HOST">Host</SelectItem>
                          <SelectItem value="CO_HOST">Co-Host</SelectItem>
                          <SelectItem value="REQUIRED">Required</SelectItem>
                          <SelectItem value="OPTIONAL">Optional</SelectItem>
                          <SelectItem value="OBSERVER">Observer</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isAdding}>
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Add Attendee
                  </>
                </Button>
              </div>
            </form>
          </Form>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Attendees ({attendees.length})</h3>
            </div>

            {attendees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-muted">
                <Users className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-muted-foreground">
                  No attendees assigned yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add members from the form above to assign them to this meeting
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {attendees.map((attendee) => (
                  <AttendeeCard
                    key={attendee.id}
                    attendee={attendee}
                    onRemove={() => onRemoveAttendee(attendee.userId)}
                    isRemoving={isRemoving}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
