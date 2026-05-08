"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@phosphor-icons/react";

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
import http from "@src/shared/utils/http";

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

export default function MeetingsPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => http.get<Meeting[]>("/meetings?limit=50"),
    select: (data) => data.data,
  });

  const meetings = data ?? [];

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

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Meetings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage all meetings in your association.
        </p>
      </div>

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
                        {meeting.type}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

