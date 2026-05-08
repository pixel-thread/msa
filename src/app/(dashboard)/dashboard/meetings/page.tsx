"use client";

import { useState } from "react";
import { useAuthStore } from "@src/shared/stores/auth";

import {
  useMeetings,
  useMeetingAttendees,
  useMembers,
  useRsvp,
} from "@feature/meetings/hooks";
import { RsvpDialog } from "@feature/meetings/components/RsvpDialog";
import {
  MeetingsTable,
  CreateMeetingDialog,
} from "@feature/meetings/components";
import { ManageAttendeesDialog } from "@feature/meetings/components";
import {
  isHighRoleUser,
  type Meeting,
  type CreateMeetingForm,
  type AddAttendeeForm,
} from "@feature/meetings/types";

export default function MeetingsPage() {
  const { user } = useAuthStore();
  const isHighRole = user ? isHighRoleUser(user.role) : false;

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [attendeesDialogOpen, setAttendeesDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [createForm, setCreateForm] = useState<CreateMeetingForm>({
    title: "",
    type: "GENERAL_MEETING",
    scheduledAt: "",
    venue: "",
    agendaItems: "",
  });
  const [attendeeForm, setAttendeeForm] = useState<AddAttendeeForm>({
    userId: "",
    attendeeRole: "ATTENDEE",
  });

  const {
    meetings,
    isLoading,
    createMeeting,
    deleteMeeting,
    isCreating,
    isDeleting,
  } = useMeetings();

  const { members } = useMembers();

  const {
    rsvpDialogOpen,
    setRsvpDialogOpen,
    rsvpForm,
    setRsvpForm,
    closeRsvpDialog,
    submitRsvp,
    isPending: isRsvpPending,
  } = useRsvp();

  const { attendees, addAttendee, removeAttendee, isAdding, isRemoving } =
    useMeetingAttendees(selectedMeeting?.id || null);

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    createMeeting(createForm, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setCreateForm({
          title: "",
          type: "GENERAL_MEETING",
          scheduledAt: "",
          venue: "",
          agendaItems: "",
        });
      },
    });
  };

  const handleAddAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;
    addAttendee({
      meetingId: selectedMeeting.id,
      userId: attendeeForm.userId,
      attendeeRole: attendeeForm.attendeeRole,
    });
    setAttendeeForm({ userId: "", attendeeRole: "ATTENDEE" });
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
            form={createForm}
            onFormChange={setCreateForm}
            onSubmit={handleCreateMeeting}
            isPending={isCreating}
          />
        )}
      </div>

      <MeetingsTable onOpenAttendees={handleOpenAttendees} />

      {isHighRole && (
        <ManageAttendeesDialog
          open={attendeesDialogOpen}
          onOpenChange={setAttendeesDialogOpen}
          meeting={selectedMeeting}
          members={members || []}
          attendees={attendees}
          attendeeForm={attendeeForm}
          onAttendeeFormChange={setAttendeeForm}
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

      <RsvpDialog open={rsvpDialogOpen} onOpenChange={setRsvpDialogOpen} />
    </div>
  );
}
