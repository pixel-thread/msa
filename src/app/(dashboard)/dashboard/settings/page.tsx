"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@src/shared/components/ui/card";
import { Gear } from "@phosphor-icons/react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <Card>
        <CardHeader className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Settings</CardTitle>
              <CardDescription className="text-sm">
                Coming soon - settings and preferences
              </CardDescription>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Gear className="h-4 w-4 text-indigo-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Gear className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Settings coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
