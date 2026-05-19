import { redirect } from "next/navigation";
import Link from "next/link";

import { Card, CardHeader, CardTitle, CardContent } from "@src/shared/components/ui/card";
import { Button } from "@src/shared/components/ui/button";
import { getAuthFromCookies } from "@src/shared/api/auth";
import { getUserFirst } from "@src/shared/services/user/getUserFirst";

export default async function DashboardPage() {
  const auth = await getAuthFromCookies();

  if (!auth) {
    redirect("/sign-in");
  }

  const user = await getUserFirst({
    where: { id: auth.userId },
  });

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Welcome back, {user.name || "User"}
          </h1>
          <p className="mt-1 text-base text-body">
            Manage your association activities and account settings
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
          >
            <Link href="/change-password">Change Password</Link>
          </Button>
          <Button
            asChild
            className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-active"
          >
            <Link href="/dashboard/settings">Account Settings</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-xl border-hairline bg-surface-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-normal text-ink">
              {user.mfaEnabled ? (
                <span className="text-semantic-up">Protected</span>
              ) : (
                <span className="text-accent-yellow">Setup MFA</span>
              )}
            </div>
            <p className="mt-1 text-sm text-body">
              {user.mfaEnabled
                ? "Two-factor authentication enabled"
                : "Enable two-factor authentication for extra security"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-hairline bg-surface-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
              Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-normal text-ink">
              {Array.isArray(user.role) ? user.role.join(", ") : user.role}
            </div>
            <p className="mt-1 text-sm text-body">Your association role</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-hairline bg-surface-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-normal text-ink">{user.email}</div>
            <p className="mt-1 text-sm text-body">Primary contact email</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-hairline bg-surface-soft p-8">
        <h2 className="text-2xl font-normal tracking-tight text-ink">
          Quick Actions
        </h2>
        <p className="mt-2 text-base text-body">
          Manage your account settings and security preferences
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            asChild
            className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-active"
          >
            <Link href="/change-password">Change Password</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
          >
            <Link href="/dashboard/security">Security Settings</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
          >
            <Link href="/dashboard/profile">Edit Profile</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
