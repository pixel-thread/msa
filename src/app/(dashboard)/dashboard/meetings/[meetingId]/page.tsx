"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, MapPin, Clock, Users } from "@phosphor-icons/react";

import { Button } from "@src/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/shared/components/ui/card";
import { Badge } from "@src/shared/components/ui/badge";
import { DataTable } from "@src/shared/components/data-table";
import { useMeetingDetail } from "@src/features/meetings/hooks/useMeetingDetail";
import { useMeetingAttendeesColumns } from "@src/features/meetings/hooks/useMeetingAttendeesColumns";
import { formatDate } from "@src/shared/utils";

interface PageProps {
  params: Promise<{ meetingId: string }>;
}

export default function MeetingDetailPage({ params }: PageProps) {
  const { meetingId } = use(params);
  const router = useRouter();
  const { columns } = useMeetingAttendeesColumns();
  const { meeting, isLoading, error } = useMeetingDetail(meetingId);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load meeting</p>
          <p className="text-sm text-red-500 mt-1">{error.message}</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => router.push("/dashboard/meetings")}
          >
            Back to meetings
          </Button>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Meeting not found</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => router.push("/dashboard/meetings")}
          >
            Back to meetings
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      SCHEDULED: "default",
      COMPLETED: "secondary",
      CANCELLED: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/meetings")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{meeting.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Meeting details and attendees
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {getStatusBadge(meeting.status)}
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Date & Time</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-sm font-medium">{formatDate(meeting.scheduledAt)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(meeting.scheduledAt).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Venue</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-sm font-medium">{meeting.venue || "Not specified"}</div>
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attendees</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-semibold">{meeting.attendees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {meeting.attendees.filter((a) => a.rsvpStatus === "ACCEPTED").length} confirmed
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Meeting Information</CardTitle>
              <CardDescription className="text-sm">
                Type and description
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Meeting Type</span>
              <div>
                <Badge variant="outline">{meeting.type}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">Organized By</span>
              <div>
                <p className="text-sm">{meeting.createdBy.name}</p>
                <p className="text-xs text-muted-foreground">{meeting.createdBy.email}</p>
              </div>
            </div>
            {meeting.description && (
              <div className="md:col-span-2 space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Description</span>
                <p className="text-sm">{meeting.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Attendees</CardTitle>
              <CardDescription className="text-sm">
                Members assigned to this meeting
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {meeting.attendees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No attendees assigned</p>
            </div>
          ) : (
            <DataTable data={meeting.attendees} columns={columns} loading={false} />
          )}
        </CardContent>
      </Card>

      {meeting.agendaItems.length > 0 && (
        <Card>
          <CardHeader className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Agenda</CardTitle>
                <CardDescription className="text-sm">
                  Meeting agenda items
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-3">
              {meeting.agendaItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-3 rounded-lg border"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.duration} min
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}