'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import {
  useMeetingDetail,
  type AgendaItem,
  type Attendee,
} from '@src/features/meetings/hooks/useMeetingDetail';
import { useMeetingAttendees } from '@src/features/meetings/hooks';
import { Card, CardHeader, CardTitle, CardContent } from '@src/shared/components/ui/card';
import { Badge } from '@src/shared/components/ui/badge';
import { Button } from '@src/shared/components/ui/button';
import { SectionHeader } from '@src/shared/components/section-header';
import { Separator } from '@src/shared/components/ui/separator';
import { formatDate } from '@src/shared/utils';
import {
  Calendar,
  MapPin,
  Users,
  FileText,
  Clock,
  Pencil,
  Trash2,
  ClipboardList,
} from 'lucide-react';
import { EditMeetingDialog } from '@src/features/meetings/components/EditMeetingDialog';
import { DeleteMeetingDialog } from '@src/features/meetings/components/DeleteMeetingDialog';
import { ManageAttendeesDialog } from '@src/features/meetings/components/ManageAttendeesDialog';
import type { AssignAttendeeInput } from '@src/features/meetings/validators';
import { useMembers } from '@src/features/members/hooks/useMembers';
import Link from 'next/link';
import { getTypeBadge } from '@src/shared/utils/helper/get-type-badge';
import { getStatusBadge } from '@src/shared/utils/helper/get-status-badge';
import { getRsvpBadge } from '@src/shared/utils/helper/get-rsvp-badge';

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const meetingId = params.meetingId as string;
  const [editOpen, setEditOpen] = useState(searchParams.get('edit') === 'true');
  const [manageAttendeesOpen, setManageAttendeesOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { meeting, isLoading, error } = useMeetingDetail(meetingId);
  const { members } = useMembers();
  const { attendees, addAttendee, removeAttendee, isAdding, isRemoving } =
    useMeetingAttendees(meetingId);

  const handleAddAttendee = (data: AssignAttendeeInput) => {
    addAttendee({ meetingId, ...data });
  };

  const handleRemoveAttendee = (userId: string) => {
    removeAttendee({ meetingId, userId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading meeting details...</p>
      </div>
    );
  }

  if (error || !meeting) {
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
        titleBadges={<>{getStatusBadge(meeting.status)}{getTypeBadge(meeting.type)}</>}
        description="Meeting details and agenda"
      >
        <Link href={`/meetings/${meetingId}/minutes`}>
          <Button
            variant="outline"
            className="h-11 border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
          >
            <ClipboardList className="mr-2 h-4 w-4" />
            Minutes
          </Button>
        </Link>
        <Link href={`/meetings/${meetingId}/assign`}>
          <Button
            variant="outline"
            className="h-11 border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
          >
            <Users className="mr-2 h-4 w-4" />
            Manage Attendees
          </Button>
        </Link>
        <Button
          variant="outline"
          onClick={() => setDeleteOpen(true)}
          className="h-11 border-hairline bg-canvas px-5 text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
        <Button
          onClick={() => setEditOpen(true)}
          className="h-11 bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-active"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit Meeting
        </Button>
      </SectionHeader>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className=" border-hairline bg-surface-card md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Meeting Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Scheduled</p>
                    <p className="text-sm text-ink">{formatDate(meeting.scheduledAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Venue</p>
                    <p className="text-sm text-ink">{meeting.venue || 'Not set'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Attendees</p>
                    <p className="text-sm text-ink">{meeting.attendees?.length || 0}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Organizer</p>
                    <p className="text-sm text-ink">{meeting.createdBy?.name || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              {meeting.description && (
                <>
                  <Separator className="bg-hairline" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Description</p>
                    <p className="mt-1 text-sm text-ink">{meeting.description}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className=" border-hairline bg-surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Agenda Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meeting.agendaItems && meeting.agendaItems.length > 0 ? (
              <div className="space-y-3">
                {meeting.agendaItems.map((item: AgendaItem, index: number) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center bg-muted text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{item.title}</p>
                      {item.duration && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {item.duration} min
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No agenda items</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className=" border-hairline bg-surface-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Attendees
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meeting.attendees && meeting.attendees.length > 0 ? (
            <div className="space-y-3">
              {meeting.attendees.map((attendee: Attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between border border-hairline p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{attendee.user.name}</p>
                    <p className="text-xs text-muted-foreground">{attendee.user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {attendee.attendeeRole}
                    </Badge>
                    {getRsvpBadge(attendee.rsvpStatus)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No attendees assigned</p>
          )}
        </CardContent>
      </Card>

      <EditMeetingDialog
        meeting={meeting}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            const url = new URL(window.location.href);
            url.searchParams.delete('edit');
            window.history.replaceState({}, '', url.toString());
          }
        }}
      />

      <ManageAttendeesDialog
        open={manageAttendeesOpen}
        onOpenChange={setManageAttendeesOpen}
        meeting={meeting}
        members={members || []}
        attendees={attendees || []}
        onAddAttendee={handleAddAttendee}
        onRemoveAttendee={handleRemoveAttendee}
        isAdding={isAdding}
        isRemoving={isRemoving}
      />

      <DeleteMeetingDialog
        meeting={meeting}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => router.push('/meetings')}
      />
    </>
  );
}
