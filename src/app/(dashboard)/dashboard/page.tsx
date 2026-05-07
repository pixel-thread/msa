"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/components/ui/table";
import { useAuthStore } from "@store/auth";
import http from "@shared/utils/http";

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
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [subRes, meetingsRes, membersRes] = await Promise.all([
          http.get<SubscriptionStatus>("/subscriptions/me"),
          http.get<{ meetings: Meeting[] }>("/meetings?limit=5"),
          http.get<{ members: Member[] }>("/members?limit=20"),
        ]);

        if (subRes.success && subRes.data) {
          setSubscription(subRes.data);
        }
        if (meetingsRes.success && meetingsRes.data) {
          setMeetings(meetingsRes.data.meetings);
        }
        if (membersRes.success && membersRes.data) {
          setMembers(membersRes.data.members);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || "Member"}
          </p>
        </div>
      </div>

      <Tabs defaultValue="plan" className="space-y-4">
        <TabsList>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="plan" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Membership Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subscription?.plan?.name || "No Plan"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {subscription?.plan?.description || "Contact admin to set up"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Plan Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subscription?.plan
                    ? formatCurrency(subscription.plan.amount, subscription.plan.currency)
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {subscription?.plan?.billingCycle === "ONE_TIME"
                    ? "One-time payment"
                    : "Yearly"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subscription?.hasPaid ? "Paid" : "Unpaid"}
                </div>
                {subscription?.lastPayment && (
                  <p className="text-xs text-muted-foreground">
                    Paid on {formatDate(subscription.lastPayment.paymentDate)}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {!subscription?.hasPaid && subscription?.plan && (
            <Card className="border-indigo-500">
              <CardHeader>
                <CardTitle>Complete Your Membership</CardTitle>
                <CardDescription>
                  Pay the membership fee to activate your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button>Pay Now - {formatCurrency(subscription.plan.amount, subscription.plan.currency)}</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Meetings</CardTitle>
              <CardDescription>Recent meetings in your association</CardDescription>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No meetings scheduled</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Attendees</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meetings.map((meeting) => (
                      <TableRow key={meeting.id}>
                        <TableCell className="font-medium">{meeting.title}</TableCell>
                        <TableCell>{meeting.type}</TableCell>
                        <TableCell>{getStatusBadge(meeting.status)}</TableCell>
                        <TableCell>{formatDate(meeting.scheduledAt)}</TableCell>
                        <TableCell>{meeting._count.attendees}</TableCell>
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
            <CardHeader>
              <CardTitle>Association Members</CardTitle>
              <CardDescription>Members in your association</CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No members found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Member Since</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell>{formatDate(member.createdAt)}</TableCell>
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