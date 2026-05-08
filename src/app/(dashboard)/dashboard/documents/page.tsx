"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@src/shared/components/ui/card";
import { FileText } from "@phosphor-icons/react";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Access and manage association documents.
        </p>
      </div>

      <Card>
        <CardHeader className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Documents</CardTitle>
              <CardDescription className="text-sm">
                Coming soon - document management system
              </CardDescription>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-indigo-500" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No documents available yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
