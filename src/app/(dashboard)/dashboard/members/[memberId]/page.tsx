"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  User,
  Envelope,
  Phone,
  Calendar,
  CreditCard,
  Users,
  Buildings,
} from "@phosphor-icons/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@src/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@src/shared/components/ui/card";
import { Badge } from "@src/shared/components/ui/badge";
import { Avatar, AvatarFallback } from "@src/shared/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@src/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import { useMemberDetail } from "@src/features/members/hooks/useMemberDetail";
import { formatDate } from "@src/shared/utils";
import http from "@src/shared/utils/http";

interface PageProps {
  params: Promise<{ memberId: string }>;
}

interface Association {
  id: string;
  name: string;
}

export default function MemberDetailPage({ params }: PageProps) {
  const { memberId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState("");

  console.log(memberId);
  const { member, isLoading, error } = useMemberDetail(memberId);

  const { data: associations } = useQuery({
    queryKey: ["associations"],
    queryFn: async () => {
      const res = await http.get<Association[]>("/associations");
      return res.data;
    },
  });

  const changeOrgMutation = useMutation({
    mutationFn: async (newOrgId: string) => {
      const res = await http.patch(`/api/members/${memberId}`, {
        associationId: newOrgId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member", memberId] });
      setIsOrgDialogOpen(false);
      setSelectedOrgId("");
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
          <p className="text-muted-foreground">Failed to load member</p>
          <p className="text-sm text-red-500 mt-1">{error.message}</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => router.push("/dashboard/members")}
          >
            Back to members
          </Button>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Member not found</p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => router.push("/dashboard/members")}
          >
            Back to members
          </Button>
        </div>
      </div>
    );
  }

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

  const getPaymentBadge = (hasPaid: boolean) => {
    return hasPaid ? (
      <Badge variant="default" className="bg-emerald-500">
        Paid
      </Badge>
    ) : (
      <Badge variant="destructive">Unpaid</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/members")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {member.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Member details and activity
          </p>
        </div>
        <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Buildings className="h-4 w-4" />
              Change Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Member Organization</DialogTitle>
              <DialogDescription>
                Move this member to a different association. This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new association" />
                </SelectTrigger>
                <SelectContent>
                  {associations?.map((assoc) => (
                    <SelectItem key={assoc.id} value={assoc.id}>
                      {assoc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsOrgDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => changeOrgMutation.mutate(selectedOrgId)}
                disabled={!selectedOrgId || changeOrgMutation.isPending}
              >
                {changeOrgMutation.isPending
                  ? "Changing..."
                  : "Change Organization"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {getStatusBadge(member.status)}
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Membership
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-sm font-medium">
              {member.membershipNumber || "Not assigned"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Member since{" "}
              {formatDate(member.dateOfJoiningMfsa || member.createdAt)}
            </p>
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Payments
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {getPaymentBadge(member.hasPaid)}
            <p className="text-xs text-muted-foreground mt-1">
              {member._count.payments} payment(s) made
            </p>
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Meetings
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-semibold">
              {member._count.meetingAttendances}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              meetings attended
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Personal Information
                </CardTitle>
                <CardDescription className="text-sm">
                  Basic member details
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-muted">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{member.name}</h3>
                <Badge variant="outline" className="mt-1">
                  {member.role}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Envelope className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Email</span>
                  <p className="text-sm">{member.email}</p>
                </div>
              </div>

              {member.mobile && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Mobile
                    </span>
                    <p className="text-sm">{member.mobile}</p>
                  </div>
                </div>
              )}

              {member.designation && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Designation
                    </span>
                    <p className="text-sm">{member.designation}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-5 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Membership Details</CardTitle>
                <CardDescription className="text-sm">
                  Membership and payment info
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">
                    Membership Number
                  </span>
                  <p className="text-sm">
                    {member.membershipNumber || "Not assigned"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">
                    Joined MFSA
                  </span>
                  <p className="text-sm">
                    {member.dateOfJoiningMfsa
                      ? formatDate(member.dateOfJoiningMfsa)
                      : "Not available"}
                  </p>
                </div>
              </div>

              {member.dateOfJoiningGovt && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Joined Government
                    </span>
                    <p className="text-sm">
                      {formatDate(member.dateOfJoiningGovt)}
                    </p>
                  </div>
                </div>
              )}

              {member.lastPaymentDate && (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Last Payment
                    </span>
                    <p className="text-sm">
                      {formatDate(member.lastPaymentDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

