"use client";

import { useParams, useRouter } from "next/navigation";

import { useMember } from "@src/features/members/hooks/useMember";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@src/shared/components/ui/card";
import { Badge } from "@src/shared/components/ui/badge";
import { Button } from "@src/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@src/shared/components/ui/avatar";
import { Separator } from "@src/shared/components/ui/separator";
import { formatDate } from "@src/shared/utils";
import { Mail, Phone, Calendar, Hash, Briefcase } from "lucide-react";
import { getInitials } from "../utils/helper/get-initials";
import { getStatusBadge } from "../utils/helper/get-status-badge";

export function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.memberId as string;

  const { member, isLoading, error } = useMember(memberId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading member details...</p>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-lg text-body">Member not found</p>
        <Button
          variant="outline"
          className="mt-4 h-11 rounded-full border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
          onClick={() => router.back()}
        >
          Go back
        </Button>
      </div>
    );
  }

  const roles = Array.isArray(member.role) ? member.role : [member.role];

  return (
    <>
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            {member.name}
          </h1>
          <p className="mt-1 text-base text-body">
            Member details and activity
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-xl border-hairline bg-surface-card md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-sm bg-muted">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-medium text-ink">{member.name}</p>
                  <p className="text-sm text-body">{member.email}</p>
                </div>
              </div>

              <Separator className="bg-hairline" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs font-medium text-muted">Email</p>
                    <p className="text-sm text-ink">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs font-medium text-muted">Mobile</p>
                    <p className="text-sm text-ink">
                      {member.mobile || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Hash className="mt-0.5 h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs font-medium text-muted">
                      Membership Number
                    </p>
                    <p className="text-sm text-ink">
                      {member.membershipNumber || "Not assigned"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Briefcase className="mt-0.5 h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs font-medium text-muted">
                      Designation
                    </p>
                    <p className="text-sm text-ink">
                      {member.designation || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-xl border-hairline bg-surface-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-body">Status</span>
                  {getStatusBadge(member.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-body">Roles</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {roles.map((role) => (
                      <Badge key={role} variant="outline" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-hairline bg-surface-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs font-medium text-muted">
                      Joined MFSA
                    </p>
                    <p className="text-sm text-ink">
                      {member.dateOfJoiningMfsa
                        ? formatDate(member.dateOfJoiningMfsa)
                        : "Not set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted" />
                  <div>
                    <p className="text-xs font-medium text-muted">
                      Joined Govt
                    </p>
                    <p className="text-sm text-ink">
                      {member.dateOfJoiningGovt
                        ? formatDate(member.dateOfJoiningGovt)
                        : "Not set"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-xl border-hairline bg-surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
              Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-body">Payment Status</span>
                <Badge variant={member.hasPaid ? "default" : "outline"}>
                  {member.hasPaid ? "Paid" : "Unpaid"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-body">Total Payments</span>
                <span className="text-sm font-medium text-ink">
                  {member._count?.payments || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-body">Last Payment</span>
                <span className="text-sm text-ink">
                  {member.lastPaymentDate
                    ? formatDate(member.lastPaymentDate)
                    : "Never"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-hairline bg-surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-body">Meeting Attendance</span>
                <span className="text-sm font-medium text-ink">
                  {member._count?.meetingAttendances || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-hairline bg-surface-card">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-body">Created</span>
                <span className="text-sm text-ink">
                  {formatDate(member.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-body">Updated</span>
                <span className="text-sm text-ink">
                  {formatDate(member.updatedAt)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
