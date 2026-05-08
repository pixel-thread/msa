"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { UserIcon as Users } from "@phosphor-icons/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@src/shared/components/ui/card";
import { DataTable } from "@src/shared/components/data-table";
import { useMemberTableColumns } from "@src/features/members/hooks/useMemberTableColumns";
import http from "@src/shared/utils/http";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  membershipNumber: string | null;
  createdAt: string;
}

export default function MembersPage() {
  const router = useRouter();
  const { columns } = useMemberTableColumns();
  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await http.get<Member[]>("/members?limit=50");
      return res.data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage and view all members in your association.
        </p>
      </div>

      <Card>
        <CardHeader className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">All Members</CardTitle>
              <CardDescription className="text-sm">
                Total of {members?.length} members in your association
              </CardDescription>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-indigo-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {members?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No members found</p>
            </div>
          ) : (
            <DataTable data={members} columns={columns} loading={isLoading} meta={{ router }} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
