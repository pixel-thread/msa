import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@src/shared/components/ui/badge";
import { Avatar, AvatarFallback } from "@src/shared/components/ui/avatar";

interface AttendeeRow {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    membershipNumber: string | null;
  };
  rsvpStatus: string | null;
  attendeeRole: string;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getRsvpBadge = (status: string | null) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    ACCEPTED: "default",
    DECLINED: "destructive",
    PENDING: "outline",
  };
  return <Badge variant={variants[status || "PENDING"] || "outline"}>{status || "PENDING"}</Badge>;
};

const baseColumns: ColumnDef<AttendeeRow>[] = [
  {
    accessorKey: "user",
    header: "Member",
    cell: ({ row }) => {
      const attendee = row.original;
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-muted">
              {getInitials(attendee.user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{attendee.user.name}</span>
            {attendee.user.membershipNumber && (
              <span className="text-xs text-muted-foreground">
                {attendee.user.membershipNumber}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "user.email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">{row.original.user.email}</span>
    ),
  },
  {
    accessorKey: "attendeeRole",
    header: "Role",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.original.attendeeRole}
      </Badge>
    ),
  },
  {
    accessorKey: "rsvpStatus",
    header: "RSVP Status",
    cell: ({ row }) => getRsvpBadge(row.original.rsvpStatus),
  },
];

export const useMeetingAttendeesColumns = (): { columns: ColumnDef<AttendeeRow>[] } => {
  const columns: ColumnDef<AttendeeRow>[] = [...baseColumns];
  return { columns };
};