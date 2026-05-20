"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMeetingDetail } from "@src/features/meetings/hooks/useMeetingDetail";
import { useMeetingAttendees } from "@src/features/meetings/hooks/useMeetings";
import { ManageAttendeesDialog } from "@src/features/meetings/components/ManageAttendeesDialog";
import { useMembers } from "@src/features/members/hooks/useMembers";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@src/shared/components/ui/card";
import { Badge } from "@src/shared/components/ui/badge";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@src/shared/components/ui/table";
import {
  ArrowLeft,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  UserPlus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import { toast } from "sonner";

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
  const [search, setSearch] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [rsvpFilter, setRsvpFilter] = useState<string>("all");

  const { meeting, isLoading: meetingLoading } = useMeetingDetail(meetingId);
  const { members } = useMembers();
  const { attendees, isLoading: attendeesLoading, removeAttendee, addAttendee } = useMeetingAttendees(meetingId);

  const updateAttendeeMutation = useMutation({
    mutationFn: ({ userId, attendeeRole }: { userId: string; attendeeRole: string }) =>
      http.patch(`/meetings/${meetingId}/attendees/${userId}`, {
        userId,
        attendeeRole,
      }),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["meeting-attendees", meetingId] });
        toast.success("Attendee updated successfully");
      } else {
        toast.error(res.message || "Failed to update attendee");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update attendee");
    },
  });

  const filteredAttendees = (attendees as AttendeeRow[]).filter((a) => {
    const matchesSearch =
      a.user.name.toLowerCase().includes(search.toLowerCase()) ||
      a.user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || a.attendeeRole === roleFilter;
    const matchesRsvp = rsvpFilter === "all" || a.rsvpStatus === rsvpFilter;
    return matchesSearch && matchesRole && matchesRsvp;
  });

  const stats = {
    total: attendees.length,
    accepted: (attendees as AttendeeRow[]).filter((a) => a.rsvpStatus === "ACCEPTED").length,
    declined: (attendees as AttendeeRow[]).filter((a) => a.rsvpStatus === "DECLINED").length,
    pending: (attendees as AttendeeRow[]).filter((a) => a.rsvpStatus === "PENDING").length,
  };

  const getRsvpBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACCEPTED: "default",
      DECLINED: "destructive",
      PENDING: "secondary",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      REQUIRED: "default",
      OPTIONAL: "secondary",
      OBSERVER: "outline",
    };
    return <Badge variant={variants[role] || "outline"}>{role}</Badge>;
  };

  const handleRemoveAttendee = (userId: string) => {
    removeAttendee({ meetingId, userId });
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    updateAttendeeMutation.mutate({ userId, attendeeRole: newRole });
  };

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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            {meeting.title}
          </h1>
          <p className="mt-1 text-base text-body">
            Manage meeting attendees and assignments
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-xl border-hairline bg-surface-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-muted" />
              <div>
                <p className="text-xs font-medium text-muted">Total</p>
                <p className="text-lg font-medium text-ink mt-1">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-hairline bg-surface-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs font-medium text-muted">Accepted</p>
                <p className="text-lg font-medium text-green-600 mt-1">{stats.accepted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-hairline bg-surface-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-xs font-medium text-muted">Declined</p>
                <p className="text-lg font-medium text-red-600 mt-1">{stats.declined}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-hairline bg-surface-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted" />
              <div>
                <p className="text-xs font-medium text-muted">Pending</p>
                <p className="text-lg font-medium text-ink mt-1">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Search attendees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 w-[250px]"
            />
          </div>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px] h-10">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="REQUIRED">Required</SelectItem>
              <SelectItem value="OPTIONAL">Optional</SelectItem>
              <SelectItem value="OBSERVER">Observer</SelectItem>
            </SelectContent>
          </Select>

          <Select value={rsvpFilter} onValueChange={setRsvpFilter}>
            <SelectTrigger className="w-[160px] h-10">
              <SelectValue placeholder="RSVP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All RSVP</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="DECLINED">Declined</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => setManageOpen(true)} className="h-10">
          <UserPlus className="mr-2 h-4 w-4" />
          Assign Member
        </Button>
      </div>

      <Card className="rounded-xl border-hairline bg-surface-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
            Attendees ({filteredAttendees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendeesLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-body">Loading attendees...</p>
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted mb-4" />
              <p className="text-base text-body">No attendees found</p>
              <p className="text-sm text-muted mt-1">
                Assign members to this meeting to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="w-[150px]">Role</TableHead>
                  <TableHead className="w-[150px]">RSVP Status</TableHead>
                  <TableHead className="w-[200px]">Change Role</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendees.map((attendee) => (
                  <TableRow key={attendee.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{attendee.user.name}</p>
                        <p className="text-xs text-muted">{attendee.user.email}</p>
                        {attendee.user.membershipNumber && (
                          <p className="text-xs text-muted">#{attendee.user.membershipNumber}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(attendee.attendeeRole)}</TableCell>
                    <TableCell>{getRsvpBadge(attendee.rsvpStatus)}</TableCell>
                    <TableCell>
                      <Select
                        value={attendee.attendeeRole}
                        onValueChange={(value) => handleRoleChange(attendee.userId, value)}
                      >
                        <SelectTrigger className="h-8 w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REQUIRED">Required</SelectItem>
                          <SelectItem value="OPTIONAL">Optional</SelectItem>
                          <SelectItem value="OBSERVER">Observer</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleRemoveAttendee(attendee.userId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center gap-4">
        <Link
          href={`/meetings/${meetingId}`}
          className="text-sm text-primary hover:underline"
        >
          ← Back to Meeting Details
        </Link>
        <Link
          href={`/meetings/${meetingId}/minutes`}
          className="text-sm text-primary hover:underline"
        >
          View Minutes →
        </Link>
      </div>

      <ManageAttendeesDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        meeting={{ id: meetingId, title: meeting?.title || "" }}
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
