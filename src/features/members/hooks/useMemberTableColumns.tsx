import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@src/shared/components/ui/badge";
import { Avatar, AvatarFallback } from "@src/shared/components/ui/avatar";
import { formatDate } from "@src/shared/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  membershipNumber: string | null;
  createdAt: string;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getStatusBadge = (status: string) => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    ACTIVE: "default",
    INACTIVE: "secondary",
    SUSPENDED: "destructive",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
};

export const useMemberTableColumns = (): { columns: ColumnDef<Member>[] } => {
  const columns: ColumnDef<Member>[] = [
    {
      accessorKey: "name",
      header: "Member",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <Link
            className="flex items-center gap-3 text-left hover:underline"
            href={`/dashboard/members/${member.id}`}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-muted">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{member.name}</span>
              {member.membershipNumber && (
                <span className="text-xs text-muted-foreground">
                  {member.membershipNumber}
                </span>
              )}
            </div>
          </Link>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.email}
        </span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-right text-muted-foreground text-sm block ml-auto">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
  ];

  return { columns };
};

