import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@src/shared/components/ui/badge";
import { Avatar, AvatarFallback } from "@src/shared/components/ui/avatar";
import { formatDate } from "@src/shared/utils";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@src/shared/components/ui/dropdown-menu";
import { Button } from "@src/shared/components/ui/button";
import { ChevronDown } from "lucide-react";
import { useUpdateMemberStatus } from "./useUpdateMemberStatus";
import { useUpdateMemberRole } from "./useUpdateMemberRole";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: string[];
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
    PENDING: "outline",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
};

const ROLES = ["MEMBER", "DPO", "FINANCE", "SECRETARY", "PRESIDENT", "SUPER_ADMIN"] as const;
const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"] as const;

export const useMemberTableColumns = (): { columns: ColumnDef<Member>[] } => {
  const updateStatus = useUpdateMemberStatus();
  const updateRole = useUpdateMemberRole();

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
      cell: ({ row }) => {
        const member = row.original;
        const roles = Array.isArray(member.role) ? member.role : [member.role];

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-[160px] justify-between border-hairline"
              >
                <span className="truncate">
                  {roles.length > 0 ? roles.join(", ") : "No role"}
                </span>
                <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuLabel>Select Roles</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ROLES.map((role) => (
                <DropdownMenuCheckboxItem
                  key={role}
                  checked={roles.includes(role)}
                  onCheckedChange={(checked) => {
                    updateRole.mutate({
                      memberId: member.id,
                      role,
                      action: checked ? "add" : "remove",
                    });
                  }}
                >
                  {role}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const member = row.original;

        return (
          <Select
            value={member.status}
            onValueChange={(newStatus) => {
              updateStatus.mutate({
                memberId: member.id,
                status: newStatus,
              });
            }}
          >
            <SelectTrigger className="h-8 w-[140px] border-hairline">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {getStatusBadge(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
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
