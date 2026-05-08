"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarIcon as Calendar,
  PlusIcon as Plus,
  UserIcon as Users,
  TrashIcon as Trash,
  XIcon as X,
  CheckIcon as Check,
} from "@phosphor-icons/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@src/shared/components/ui/card";
import { Badge } from "@src/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@src/shared/components/ui/table";
import { Button } from "@src/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@src/shared/components/ui/dialog";
import { Input } from "@src/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import http from "@src/shared/utils/http";
import { useAuthStore } from "@src/shared/stores/auth";
import { toast } from "sonner";

const HIGH_ROLE_USERS = ["SUPER_ADMIN", "PRESIDENT", "SECRETARY"];

interface Meeting {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  venue: string | null;
  createdBy: {
    name: string;
    email: string;
  };
  _count: {
    attendees: number;
  };
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface Attendee {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
}

interface CreateMeetingForm {
  title: string;
  type: string;
  scheduledAt: string;
  venue: string;
  agendaItems: string;
}

interface AddAttendeeForm {
  userId: string;
  attendeeRole: string;
}

export default function MeetingsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isHighRole = user && HIGH_ROLE_USERS.includes(user.role);

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

  const { data, isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => http.get<Meeting[]>("/meetings?limit=50"),
    select: (d) => d.data,
  });

  const { data: membersData = [] } = useQuery({
    queryKey: ["members-all"],
    queryFn: async () => http.get<Member[]>("/members?limit=100"),
    select: (d) => d.data,
  });

  const { data: attendeesData, refetch: refetchAttendees } = useQuery({
    queryKey: ["meeting-attendees", selectedMeeting?.id],
    enabled: selectedMeeting !== null,
    queryFn: async () =>
      http.get<Attendee[]>(`/meetings/${selectedMeeting?.id}/attendees`),
    select: (d) => d.data,
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (data: CreateMeetingForm) => {
      const res = await http.post("/meetings", {
        title: data.title,
        type: data.type,
        scheduledAt: data.scheduledAt,
        venue: data.venue || undefined,
        agendaItems: data.agendaItems
          ? data.agendaItems.split("\n").filter(Boolean)
          : undefined,
      });
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setCreateDialogOpen(false);
      setCreateForm({
        title: "",
        type: "GENERAL_MEETING",
        scheduledAt: "",
        venue: "",
        agendaItems: "",
      });
      toast.success("Meeting created successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create meeting");
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      const res = await http.delete(`/meetings/${meetingId}`);
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Meeting deleted successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete meeting");
    },
  });

  const addAttendeeMutation = useMutation({
    mutationFn: async ({
      meetingId,
      data,
    }: {
      meetingId: string;
      data: AddAttendeeForm;
    }) => {
      const res = await http.post(`/meetings/${meetingId}/attendees`, data);
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      refetchAttendees();
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      setAttendeeForm({ userId: "", attendeeRole: "ATTENDEE" });
      toast.success("Attendee added successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to add attendee");
    },
  });

  const removeAttendeeMutation = useMutation({
    mutationFn: async ({
      meetingId,
      userId,
    }: {
      meetingId: string;
      userId: string;
    }) => {
      const res = await http.delete(
        `/meetings/${meetingId}/attendees/${userId}`,
      );
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      refetchAttendees();
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      toast.success("Attendee removed successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to remove attendee");
    },
  });

  const rsvpMutation = useMutation({
    mutationFn: async (meetingId: string) => {
      const res = await http.patch(
        `/meetings/${meetingId}/attendees/${user?.id}`,
        {
          status: "CONFIRMED",
        },
      );
      if (!res.success) throw new Error(res.message);
      return res;
    },
    onSuccess: () => {
      toast.success("RSVP confirmed successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to RSVP");
    },
  });

  const members = membersData ?? [];
  const meetings = data ?? [];
  const attendees = attendeesData ?? [];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      SCHEDULED: "outline",
      NOTICE_ISSUED: "default",
      COMPLETED: "default",
      CANCELLED: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    createMeetingMutation.mutate(createForm);
  };

  const handleAddAttendee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;
    addAttendeeMutation.mutate({
      meetingId: selectedMeeting.id,
      data: attendeeForm,
    });
  };

  const handleDeleteMeeting = (meeting: Meeting) => {
    if (confirm(`Are you sure you want to delete "${meeting.title}"?`)) {
      deleteMeetingMutation.mutate(meeting.id);
    }
  };

  const openAttendeesDialog = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setAttendeesDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }
  console.log(meetings);
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
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Meeting</DialogTitle>
                <DialogDescription>
                  Create a new meeting for your association.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMeeting} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Meeting title"
                    value={createForm.title}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={createForm.type}
                    onValueChange={(value) =>
                      setCreateForm({ ...createForm, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL_MEETING">
                        General Meeting
                      </SelectItem>
                      <SelectItem value="EC_MEETING">EC Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={createForm.scheduledAt}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        scheduledAt: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Venue (optional)
                  </label>
                  <Input
                    placeholder="Meeting venue"
                    value={createForm.venue}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, venue: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Agenda Items (optional)
                  </label>
                  <textarea
                    className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
                    placeholder="Enter agenda items (one per line)"
                    value={createForm.agendaItems}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        agendaItems: e.target.value,
                      })
                    }
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMeetingMutation.isPending}
                  >
                    {createMeetingMutation.isPending
                      ? "Creating..."
                      : "Create Meeting"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">All Meetings</CardTitle>
              <CardDescription className="text-sm">
                Total of {meetings?.length} meetings in your association
              </CardDescription>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No meetings scheduled
              </p>
              {isHighRole && (
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create your first meeting
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-muted/50">
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead className="text-right">Attendees</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map((meeting) => (
                  <TableRow key={meeting.id} className="border-muted/30">
                    <TableCell className="font-medium">
                      {meeting.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {meeting.type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(meeting.scheduledAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {meeting.venue || "TBD"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {meeting._count.attendees}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isHighRole && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => rsvpMutation.mutate(meeting.id)}
                            disabled={rsvpMutation.isPending}
                            className="gap-1"
                          >
                            <Check className="h-3 w-3" />
                            RSVP
                          </Button>
                        )}
                        {isHighRole && (
                          <>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => openAttendeesDialog(meeting)}
                              title="Manage Attendees"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => handleDeleteMeeting(meeting)}
                              disabled={deleteMeetingMutation.isPending}
                              className="text-destructive hover:text-destructive"
                              title="Delete Meeting"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={attendeesDialogOpen} onOpenChange={setAttendeesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Attendees</DialogTitle>
            <DialogDescription>
              {selectedMeeting?.title || ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4">
            <form onSubmit={handleAddAttendee} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-medium">Select Member</label>
                <Select
                  value={attendeeForm.userId}
                  onValueChange={(value) =>
                    setAttendeeForm({ ...attendeeForm, userId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Role</label>
                <Select
                  value={attendeeForm.attendeeRole}
                  onValueChange={(value) =>
                    setAttendeeForm({ ...attendeeForm, attendeeRole: value })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REQUIRED">Required</SelectItem>
                    <SelectItem value="OPTIONAL">Optional</SelectItem>
                    <SelectItem value="OBSERVER">Observer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={!attendeeForm.userId || addAttendeeMutation.isPending}
              >
                {addAttendeeMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </form>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="border-muted/50">
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendees.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground py-6"
                      >
                        No attendees assigned yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    attendees.map((attendee) => (
                      <TableRow key={attendee.id} className="border-muted/30">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {attendee.user.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {attendee.user.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {attendee.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {attendee.userId}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => {
                              if (!selectedMeeting) return;
                              if (
                                confirm(
                                  `Remove ${attendee.user.name} from this meeting?`,
                                )
                              ) {
                                removeAttendeeMutation.mutate({
                                  meetingId: selectedMeeting.id,
                                  userId: attendee.userId,
                                });
                              }
                            }}
                            disabled={removeAttendeeMutation.isPending}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAttendeesDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
