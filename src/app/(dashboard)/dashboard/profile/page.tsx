"use client";

import { useState } from "react";
import { useAuthStore } from "@src/shared/stores/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@src/shared/components/ui/card";
import { Avatar, AvatarFallback } from "@src/shared/components/ui/avatar";
import { Badge } from "@src/shared/components/ui/badge";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@src/shared/components/ui/dialog";
import { User, EnvelopeSimple, IdentificationBadge, CalendarCheck, ShieldCheck, ShieldWarning } from "@phosphor-icons/react";

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
            <CardTitle className="text-base">Security</CardTitle>
            <CardDescription className="text-sm">Manage your account security settings</CardDescription>
          </CardHeader>
          <CardContent className="p-0 space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  {user?.mfaEnabled ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ShieldWarning className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.mfaEnabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
              </div>
              {user?.mfaEnabled ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Disable
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                    </DialogHeader>
                    <MfaDisableForm />
                  </DialogContent>
                </Dialog>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                    </DialogHeader>
                    <MfaEnableForm />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MfaEnableForm() {
  const { setupMfa, enableMfa, isLoading } = useAuthStore();
  const [step, setStep] = useState<"password" | "verify">("password");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await setupMfa(password);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await enableMfa(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    }
  };

  if (step === "verify") {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to your email to enable 2FA.
        </p>
        <Input
          type="text"
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          className="text-center text-2xl tracking-widest"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={isLoading || code.length !== 6} className="w-full">
          {isLoading ? "Verifying..." : "Enable 2FA"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSetup} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter your password to receive a verification code.
      </p>
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={isLoading || !password} className="w-full">
        {isLoading ? "Sending..." : "Send Verification Code"}
      </Button>
    </form>
  );
}

function MfaDisableForm() {
  const { disableMfa, isLoading } = useAuthStore();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await disableMfa(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid password");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter your password to disable two-factor authentication.
      </p>
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={isLoading || !password} className="w-full">
        {isLoading ? "Disabling..." : "Disable 2FA"}
      </Button>
    </form>
  );
}
