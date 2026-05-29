'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMeetingDetail } from '@src/features/meetings/hooks/useMeetingDetail';
import { useMeetingAttendees } from '@src/features/meetings/hooks/useMeetings';
import { ManageAttendeesDialog } from '@src/features/meetings/components/ManageAttendeesDialog';
import { useMembers } from '@src/features/members/hooks/useMembers';
import { Card, CardHeader, CardTitle, CardContent } from '@src/shared/components/ui/card';
import { Button } from '@src/shared/components/ui/button';
import { SectionHeader } from '@src/shared/components/section-header';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { DataTable } from '@src/shared/components/data-table';
import { useMeetingAttendeesColumns } from '@src/features/meetings/hooks/useMeetingAttendeesColumns';
import { Users, CheckCircle2, XCircle, Clock, UserPlus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';

interface AttendeeRow {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    membershipNumber: string | null;
  };
  attendeeRole: string;
  rsvpStatus: string;
}

export default function AssignMembersPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const meetingId = params.meetingId as string;
  const [search, setSearch] = useState('');
  const [manageOpen, setManageOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [rsvpFilter, setRsvpFilter] = useState<string>('all');

  const { meeting, isLoading: meetingLoading } = useMeetingDetail(meetingId);
  const { members } = useMembers();
  const {
    attendees,
    isLoading: attendeesLoading,
    removeAttendee,
    addAttendee,
  } = useMeetingAttendees(meetingId);

  const updateAttendeeMutation = useMutation({
    mutationFn: ({ userId, attendeeRole }: { userId: string; attendeeRole: string }) =>
      http.patch(`/meetings/${meetingId}/attendees/${userId}`, {
        userId,
        attendeeRole,
      }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: ['meeting-attendees', meetingId],
        });
        toast.success('Attendee updated successfully');
      } else {
        toast.error(res.message || 'Failed to update attendee');
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update attendee');
    },
  });

  const filteredAttendees = (attendees as AttendeeRow[]).filter((a) => {
    const matchesSearch =
      a.user.name.toLowerCase().includes(search.toLowerCase()) ||
      a.user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || a.attendeeRole === roleFilter;
    const matchesRsvp = rsvpFilter === 'all' || a.rsvpStatus === rsvpFilter;
    return matchesSearch && matchesRole && matchesRsvp;
  });

  const stats = {
    total: attendees.length,
    accepted: (attendees as AttendeeRow[]).filter((a) => a.rsvpStatus === 'ACCEPTED').length,
    declined: (attendees as AttendeeRow[]).filter((a) => a.rsvpStatus === 'DECLINED').length,
    pending: (attendees as AttendeeRow[]).filter((a) => a.rsvpStatus === 'PENDING').length,
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    updateAttendeeMutation.mutate({ userId, attendeeRole: newRole });
  };

  const handleRemoveAttendee = (userId: string) => {
    removeAttendee({ meetingId, userId });
  };

  const { columns } = useMeetingAttendeesColumns({
    onRoleChange: handleRoleChange,
    onRemoveAttendee: handleRemoveAttendee,
  });

  if (meetingLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading meeting...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-lg text-body">Meeting not found</p>
        <Button
          variant="outline"
          className="mt-4 h-11 border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
          onClick={() => router.back()}
        >
          Go back
        </Button>
      </div>
    );
  }

  return (
    <>
      <SectionHeader
        title={meeting.title}
        description="Manage meeting attendees and assignments"
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className=" border-hairline bg-surface-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total</p>
                <p className="text-lg font-medium text-ink mt-1">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className=" border-hairline bg-surface-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Accepted</p>
                <p className="text-lg font-medium text-green-600 mt-1">{stats.accepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className=" border-hairline bg-surface-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Declined</p>
                <p className="text-lg font-medium text-red-600 mt-1">{stats.declined}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className=" border-hairline bg-surface-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pending</p>
                <p className="text-lg font-medium text-ink mt-1">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <DataTableFilters
          fields={[
            {
              type: 'search',
              id: 'search',
              placeholder: 'Search attendees...',
            },
            {
              type: 'select',
              id: 'role',
              label: 'Role',
              options: [
                { value: 'HOST', label: 'Host' },
                { value: 'CO_HOST', label: 'Co-Host' },
                { value: 'REQUIRED', label: 'Required' },
                { value: 'OPTIONAL', label: 'Optional' },
                { value: 'OBSERVER', label: 'Observer' },
              ],
            },
            {
              type: 'select',
              id: 'rsvp',
              label: 'RSVP',
              options: [
                { value: 'ACCEPTED', label: 'Accepted' },
                { value: 'DECLINED', label: 'Declined' },
                { value: 'PENDING', label: 'Pending' },
              ],
            },
          ]}
          onFilterChange={() => {}}
        />

        <Button onClick={() => setManageOpen(true)} className="h-10">
          <UserPlus className="mr-2 h-4 w-4" />
          Assign Member
        </Button>
      </div>

      <Card className=" border-hairline bg-surface-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Attendees ({filteredAttendees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredAttendees} loading={attendeesLoading} />
        </CardContent>
      </Card>

      <ManageAttendeesDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        meeting={{ id: meetingId, title: meeting?.title || '' }}
        members={members || []}
        attendees={attendees || []}
        onAddAttendee={(data) => addAttendee({ meetingId, ...data })}
        onRemoveAttendee={(userId) => removeAttendee({ meetingId, userId })}
        isAdding={false}
        isRemoving={false}
      />
    </>
  );
}
