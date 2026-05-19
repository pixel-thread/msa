"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  useMeetingDetail,
  type AgendaItem,
  type Attendee,
} from "@src/features/meetings/hooks/useMeetingDetail";
import {
  useMembers,
  useMeetingAttendees,
} from "@src/features/meetings/hooks/useMeetings";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@src/shared/components/ui/card";
import { Badge } from "@src/shared/components/ui/badge";
import { Button } from "@src/shared/components/ui/button";
import { Separator } from "@src/shared/components/ui/separator";
import { formatDate } from "@src/shared/utils";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  FileText,
  Clock,
  Pencil,
} from "lucide-react";
import { EditMeetingDialog } from "@src/features/meetings/components/EditMeetingDialog";
import { ManageAttendeesDialog } from "@src/features/meetings/components/ManageAttendeesDialog";
import type { AssignAttendeeInput } from "@src/features/meetings/validators";

const getStatusBadge = (status: string) => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    SCHEDULED: "default",
    IN_PROGRESS: "secondary",
    COMPLETED: "outline",
    CANCELLED: "destructive",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
};

const getTypeBadge = (type: string) => {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    GENERAL_MEETING: "default",
    EC_MEETING: "secondary",
    SPECIAL_MEETING: "outline",
  };
  return (
    <Badge variant={variants[type] || "outline"}>
      {type.replace("_", " ")}
    </Badge>
  );
};

const getRsvpBadge = (status: string | null) => {
  if (!status) return <Badge variant="outline">Pending</Badge>;
  const variants: Record<string, "default" | "secondary" | "destructive"> = {
    ACCEPTED: "default",
    DECLINED: "destructive",
    PENDING: "secondary",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
};

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const meetingId = params.meetingId as string;
  const [editOpen, setEditOpen] = useState(searchParams.get("edit") === "true");
  const [manageAttendeesOpen, setManageAttendeesOpen] = useState(false);

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

  useEffect(() => {
    // setEditOpen(searchParams.get("edit") === "true");
  }, [searchParams]);

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
          className="mt-4 h-11 rounded-full border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
          onClick={() => router.back()}
        >
          Go back
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
                {meeting.title}
              </h1>
              {getStatusBadge(meeting.status)}
              {getTypeBadge(meeting.type)}
            </div>
            <p className="mt-1 text-base text-body">
              Meeting details and agenda
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setManageAttendeesOpen(true)}
            className="h-11 rounded-full border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
          >
            <Users className="mr-2 h-4 w-4" />
            Manage Attendees
          </Button>
          <Button
            onClick={() => setEditOpen(true)}
            className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-active"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Meeting
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-xl border-hairline bg-surface-card md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
              Meeting Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs font-medium text-muted">Scheduled</p>
                    <p className="text-sm text-ink">
                      {formatDate(meeting.scheduledAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs font-medium text-muted">Venue</p>
                    <p className="text-sm text-ink">
                      {meeting.venue || "Not set"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="mt-0.5 h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs font-medium text-muted">Attendees</p>
                    <p className="text-sm text-ink">
                      {meeting.attendees?.length || 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs font-medium text-muted">Organizer</p>
                    <p className="text-sm text-ink">
                      {meeting.createdBy?.name || "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {meeting.description && (
                <>
                  <Separator className="bg-hairline" />
                  <div>
                    <p className="text-xs font-medium text-muted">
                      Description
                    </p>
                    <p className="mt-1 text-sm text-ink">
                      {meeting.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-hairline bg-surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
              Agenda Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meeting.agendaItems && meeting.agendaItems.length > 0 ? (
              <div className="space-y-3">
                {meeting.agendaItems.map((item: AgendaItem, index: number) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {item.title}
                      </p>
                      {item.duration && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted">
                          <Clock className="h-3 w-3" />
                          {item.duration} min
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">No agenda items</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-hairline bg-surface-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
            Attendees
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meeting.attendees && meeting.attendees.length > 0 ? (
            <div className="space-y-3">
              {meeting.attendees.map((attendee: Attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between rounded-lg border border-hairline p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {attendee.user.name}
                    </p>
                    <p className="text-xs text-muted">{attendee.user.email}</p>
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
            <p className="text-sm text-muted">No attendees assigned</p>
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
            url.searchParams.delete("edit");
            window.history.replaceState({}, "", url.toString());
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
    </>
  );
}
