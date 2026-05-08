"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Calendar, CreditCard, TrendUp } from "@phosphor-icons/react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@src/shared/components/ui/tabs";
import { Badge } from "@src/shared/components/ui/badge";
import { Button } from "@src/shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@src/shared/components/ui/table";
import { Avatar, AvatarFallback } from "@src/shared/components/ui/avatar";
import { useAuthStore } from "@src/shared/stores/auth";
import http from "@src/shared/utils/http";

interface Plan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: string;
  description: string | null;
}

interface SubscriptionStatus {
  hasPaid: boolean;
  plan: Plan | null;
  lastPayment: {
    id: string;
    receiptNumber: string;
    amount: number;
    paymentDate: string;
  } | null;
}

interface Meeting {
  id: string;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  venue: string | null;
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
  membershipNumber: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [paying, setPaying] = useState(false);

  const { data: subscription, isLoading: subscriptionLoading } = useQuery<SubscriptionStatus>({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await http.get<SubscriptionStatus>("/subscriptions/me");
      if (!res.success || !res.data) throw new Error("Failed to fetch subscription");
      return res.data;
    },
  });

  const { data: meetingsData, isLoading: meetingsLoading } = useQuery<{ data: Meeting[] }>({
    queryKey: ["meetings"],
    queryFn: async () => {
      const res = await http.get<{ data: Meeting[] }>("/meetings?limit=5");
      if (!res.success || !res.data) throw new Error("Failed to fetch meetings");
      return res.data;
    },
  });

  const { data: membersData, isLoading: membersLoading } = useQuery<{ members: Member[] }>({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await http.get<{ members: Member[] }>("/members?limit=10");
      if (!res.success || !res.data) throw new Error("Failed to fetch members");
      return res.data;
    },
  });

  const queryClient = useQueryClient();

  const payMutation = useMutation({
    mutationFn: async () => {
      setPaying(true);
      const res = await http.post("/subscriptions/pay");
      if (!res.success) throw new Error("Payment failed");
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
    onError: () => {
      setPaying(false);
    },
  });

  const handlePay = () => {
    payMutation.mutate();
  };

  const meetings = meetingsData?.data ?? [];
  const members = membersData?.members ?? [];

  const isLoading = subscriptionLoading || meetingsLoading || membersLoading;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      INACTIVE: "secondary",
      SUSPENDED: "destructive",
      SCHEDULED: "outline",
      COMPLETED: "default",
      CANCELLED: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {user?.name || "Member"}. Here&apos;s an overview of your association.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-semibold">{members.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active members in association
            </p>
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Meetings</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-semibold">{meetings.filter(m => m.status === "SCHEDULED").length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Scheduled meetings
            </p>
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Membership Fee</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-semibold">
              {subscription?.plan ? formatCurrency(subscription.plan.amount, subscription.plan.currency) : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {subscription?.plan?.billingCycle === "ONE_TIME" ? "One-time" : "Yearly payment"}
            </p>
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="flex flex-row items-center justify-between p-0 mb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payment Status</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <TrendUp className="h-4 w-4 text-rose-500" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-semibold">
              {subscription?.hasPaid ? "Paid" : "Unpaid"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {subscription?.hasPaid
                ? `Paid on ${formatDate(subscription.lastPayment?.paymentDate || "")}`
                : "Complete your payment"}
            </p>
          </CardContent>
        </Card>
      </div>

      {!subscription?.hasPaid && subscription?.plan && (
        <Card className="border-indigo-500/20 bg-gradient-to-r from-indigo-50/50 to-transparent dark:from-indigo-950/30 p-5">
          <CardHeader className="p-0 pb-3">
            <CardTitle className="text-base">Complete Your Membership</CardTitle>
            <CardDescription className="text-sm">
              Pay the membership fee to activate your account
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handlePay}
              disabled={paying || payMutation.isPending}
            >
              {payMutation.isPending ? "Processing..." : `Pay Now - ${formatCurrency(subscription.plan.amount, subscription.plan.currency)}`}
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="meetings" className="space-y-5">
        <TabsList>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader className="px-5 pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Meetings</CardTitle>
                  <CardDescription className="text-sm">All scheduled and past meetings in your association</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {meetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No meetings scheduled</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-muted/50">
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Attendees</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meetings.map((meeting) => (
                      <TableRow key={meeting.id} className="border-muted/30">
                        <TableCell className="font-medium">{meeting.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{meeting.type}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(meeting.scheduledAt)}
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
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader className="px-5 pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Association Members</CardTitle>
                  <CardDescription className="text-sm">All members in your association</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No members found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-muted/50">
                      <TableHead>Member</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id} className="border-muted/30">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
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
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{member.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {formatDate(member.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

