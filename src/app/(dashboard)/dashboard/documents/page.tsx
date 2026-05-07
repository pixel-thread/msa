import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { FileText } from "@phosphor-icons/react";

export default function DocumentsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Access and manage association documents.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Coming soon - document management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No documents available yet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}