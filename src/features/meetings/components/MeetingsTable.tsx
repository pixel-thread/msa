"use client";

import {
  CalendarIcon as Calendar,
  TrashIcon as Trash,
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
import { isHighRoleUser, type Meeting } from "../types";
import { useMeetings, useRsvp } from "../hooks";
import { useAuthStore } from "@src/shared/stores/auth";

interface MeetingsTableProps {
  onOpenAttendees: (meeting: Meeting) => void;
}

export function MeetingsTable({ onOpenAttendees }: MeetingsTableProps) {
  const { user } = useAuthStore();
  const isHighRole = user ? isHighRoleUser(user.role) : false;
  const { meetings, deleteMeeting, isDeleting } = useMeetings();
  const { accept, setRsvpDialogOpen, isPending: isRsvpPending } = useRsvp();

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

  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">All Meetings</CardTitle>
            <CardDescription className="text-sm">
              Total of {meetings.length} meetings in your association
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
                  <TableCell className="font-medium">{meeting.title}</TableCell>
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
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => accept(meeting.id)}
                            disabled={isRsvpPending}
                            className="gap-1"
                          >
                            Accept
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setRsvpDialogOpen(true)}
                            disabled={isRsvpPending}
                            className="text-destructive hover:text-destructive"
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {isHighRole && (
                        <>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => onOpenAttendees(meeting)}
                            title="Manage Attendees"
                          >
                            Manage
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => deleteMeeting(meeting.id)}
                            disabled={isDeleting}
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
  );
}
