"use client";

import { useAuthStore } from "@src/shared/stores/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/shared/components/ui/card";
import { Avatar, AvatarFallback } from "@src/shared/components/ui/avatar";
import { Badge } from "@src/shared/components/ui/badge";
import { User, EnvelopeSimple, IdentificationBadge, CalendarCheck } from "@phosphor-icons/react";

export default function ProfilePage() {
  const { user } = useAuthStore();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage your account information.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader className="px-0 pt-0 pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-muted">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{user?.name || "User"}</CardTitle>
                <CardDescription className="text-sm">{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <User className="h-4 w-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{user?.name || "Not set"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <EnvelopeSimple className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{user?.email || "Not set"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <IdentificationBadge className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Role</p>
                <p className="text-sm font-medium">{user?.role || "MEMBER"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <CalendarCheck className="h-4 w-4 text-rose-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <Badge variant="default" className="mt-1">ACTIVE</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="text-base">Account Details</CardTitle>
            <CardDescription className="text-sm">Additional information about your account</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Account Type</p>
                <p className="text-sm font-medium">Member</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Membership</p>
                <p className="text-sm font-medium">Active</p>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Access Level</p>
                <p className="text-sm font-medium">{user?.role || "MEMBER"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
