"use client";

import { useState } from "react";
import { Users, X, Check, X as XIcon, Clock } from "@phosphor-icons/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/shared/components/ui/dialog";
import { Button } from "@src/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@src/shared/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import type { Meeting, Member, Attendee, AddAttendeeForm } from "../types";

interface ManageAttendeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Meeting | null;
  members: Member[];
  attendees: Attendee[];
  attendeeForm: AddAttendeeForm;
  onAttendeeFormChange: (form: AddAttendeeForm) => void;
  onAddAttendee: (e: React.FormEvent) => void;
  onRemoveAttendee: (userId: string) => void;
  isAdding: boolean;
  isRemoving: boolean;
}

function RsvpStatusBadge({ status }: { status: string | undefined }) {
  const getStatusConfig = (status: string | undefined) => {
    switch (status?.toUpperCase()) {
      case "ACCEPTED":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/30",
          border: "border-emerald-200 dark:border-emerald-800",
          text: "text-emerald-700 dark:text-emerald-400",
          icon: <Check className="h-3 w-3" />,
          label: "Accepted",
        };
      case "DECLINED":
        return {
          bg: "bg-red-50 dark:bg-red-950/30",
          border: "border-red-200 dark:border-red-800",
          text: "text-red-700 dark:text-red-400",
          icon: <XIcon className="h-3 w-3" />,
          label: "Declined",
        };
      default:
        return {
          bg: "bg-amber-50 dark:bg-amber-950/30",
          border: "border-amber-200 dark:border-amber-800",
          text: "text-amber-700 dark:text-amber-400",
          icon: <Clock className="h-3 w-3" />,
          label: "Pending",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${config.bg} ${config.border} ${config.text} text-xs font-medium`}
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
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (status: string) => {
    switch (status) {
      case "REQUIRED":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300";
      case "OPTIONAL":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      case "OBSERVER":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-card hover:bg-muted/30 transition-colors group">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="text-sm font-medium bg-muted">
            {getInitials(attendee.user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{attendee.user.name}</span>
          <span className="text-xs text-muted-foreground">
            {attendee.user.email}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${getRoleColor(attendee.status)}`}
          >
            {attendee.status}
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
          <X className="h-4 w-4" />
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
  attendeeForm,
  onAttendeeFormChange,
  onAddAttendee,
  onRemoveAttendee,
  isAdding,
  isRemoving,
}: ManageAttendeesDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const stats = {
    total: attendees.length,
    accepted: attendees.filter((a) => a.rsvpStatus === "ACCEPTED").length,
    declined: attendees.filter((a) => a.rsvpStatus === "DECLINED").length,
    pending: attendees.filter(
      (a) => a.rsvpStatus !== "ACCEPTED" && a.rsvpStatus !== "DECLINED",
    ).length,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden w-[800px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg">Manage Attendees</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {meeting?.title || "Select a meeting"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">
                  {stats.accepted} Accepted
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">
                  {stats.declined} Declined
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">
                  {stats.pending} Pending
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <form
            onSubmit={onAddAttendee}
            className="flex gap-3 p-4 rounded-xl border border-border/60 bg-muted/20"
          >
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Select Member
              </label>
              <Select
                value={attendeeForm.userId}
                defaultValue="OPTIONAL"
                onValueChange={(value) =>
                  onAttendeeFormChange({ ...attendeeForm, userId: value })
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Search and select a member..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredMembers.map((member) => (
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
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Role
              </label>
              <Select
                value={attendeeForm.attendeeRole}
                onValueChange={(value) =>
                  onAttendeeFormChange({ ...attendeeForm, attendeeRole: value })
                }
              >
                <SelectTrigger className="w-36 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REQUIRED">Required</SelectItem>
                  <SelectItem value="OPTIONAL">Optional</SelectItem>
                  <SelectItem value="OBSERVER">Observer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="submit"
                disabled={!attendeeForm.userId || isAdding}
                className="h-10"
              >
                {isAdding ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Adding...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Add Attendee
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Attendees ({attendees.length})
              </h3>
            </div>

            {attendees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border-2 border-dashed border-muted">
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

export function useAttendeeForm() {
  const [form, setForm] = useState<AddAttendeeForm>({
    userId: "",
    attendeeRole: "ATTENDEE",
  });

  const resetForm = () => {
    setForm({ userId: "", attendeeRole: "ATTENDEE" });
  };

  return { form, setForm, resetForm };
}
