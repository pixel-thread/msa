"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@phosphor-icons/react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Badge } from "@shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import http from "@shared/utils/http";

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
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeetings() {
      try {
        const res = await http.get<{ data: Meeting[] }>("/meetings?limit=50");
        if (res.success && res.data) {
          setMeetings(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch meetings:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMeetings();
  }, []);

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
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      SCHEDULED: "outline",
      NOTICE_ISSUED: "default",
      COMPLETED: "default",
      CANCELLED: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
        <p className="text-muted-foreground">
          View and manage all meetings in your association.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Meetings</CardTitle>
          <CardDescription>
            Total of {meetings.length} meetings in your association
          </CardDescription>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No meetings scheduled</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableRow key={meeting.id}>
                    <TableCell className="font-medium">{meeting.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{meeting.type}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(meeting.scheduledAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {meeting.venue || "TBD"}
                    </TableCell>
                    <TableCell className="text-right">
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