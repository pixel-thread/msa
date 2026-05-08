"use client";

import { useState } from "react";
import { useAuthStore } from "@src/shared/stores/auth";

import {
  useMeetingAttendees,
  useMembers,
  useRsvp,
} from "@feature/meetings/hooks";
import { RsvpDialog } from "@feature/meetings/components/RsvpDialog";
import {
  MeetingsTable,
  CreateMeetingDialog,
  ManageAttendeesDialog,
} from "@feature/meetings/components";
import { isHighRoleUser, type Meeting } from "@feature/meetings/types";
import type { AssignAttendeeInput } from "@feature/meetings/validators";

export default function MeetingsPage() {
  const { user } = useAuthStore();
  const isHighRole = user ? isHighRoleUser(user.role) : false;

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [attendeesDialogOpen, setAttendeesDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const { members } = useMembers();
  const { setRsvpDialogOpen } = useRsvp();

  const { attendees, addAttendee, removeAttendee, isAdding, isRemoving } =
    useMeetingAttendees(selectedMeeting?.id || null);

  const handleAddAttendee = (data: AssignAttendeeInput) => {
    if (!selectedMeeting) return;
    addAttendee({
      meetingId: selectedMeeting.id,
      userId: data.userId,
      attendeeRole: data.attendeeRole,
    });
  };

  const handleOpenAttendees = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setAttendeesDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all meetings in your association.
          </p>
        </div>

        {isHighRole && (
          <CreateMeetingDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
          />
        )}
      </div>

      <MeetingsTable />

      {isHighRole && (
        <ManageAttendeesDialog
          open={attendeesDialogOpen}
          onOpenChange={setAttendeesDialogOpen}
          meeting={selectedMeeting}
          members={members || []}
          attendees={attendees}
          onAddAttendee={handleAddAttendee}
          onRemoveAttendee={(userId) => {
            if (selectedMeeting && confirm("Remove this attendee?")) {
              removeAttendee({ meetingId: selectedMeeting.id, userId });
            }
          }}
          isAdding={isAdding}
          isRemoving={isRemoving}
        />
      )}
      <RsvpDialog onOpenChange={setRsvpDialogOpen} />
    </div>
  );
}
