import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Gear } from "@phosphor-icons/react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Coming soon - settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Gear className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Settings coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}