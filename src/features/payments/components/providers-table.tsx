"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@src/shared/components/ui/table";
import { Badge } from "@src/shared/components/ui/badge";
import { Button } from "@src/shared/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { ProviderResponse } from "../types";

interface ProvidersTableProps {
  providers: ProviderResponse[];
  isLoading: boolean;
  onDelete: (providerId: string) => void;
  isDeleting: boolean;
}

export function ProvidersTable({
  providers,
  isLoading,
  onDelete,
  isDeleting,
}: ProvidersTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading providers...</p>
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-base text-body">No payment providers found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add a payment provider to start accepting payments
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Provider</TableHead>
          <TableHead>Key ID</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Added</TableHead>
          <TableHead className="w-24">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {providers.map((provider) => (
          <TableRow key={provider.id}>
            <TableCell>
              <Link
                href={`/payments/providers/${provider.id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {provider.provider}
              </Link>
            </TableCell>
            <TableCell>
              <span className="text-sm font-mono text-muted-foreground">
                {provider.keyId}
              </span>
            </TableCell>
            <TableCell>
              <Badge
                variant={provider.isActive ? "default" : "secondary"}
                className={provider.isActive ? "bg-green-600" : ""}
              >
                {provider.isActive ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {new Date(provider.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/payments/providers/${provider.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(provider.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
