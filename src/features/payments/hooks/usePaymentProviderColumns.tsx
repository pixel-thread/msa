"use client";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Badge } from "@src/shared/components/ui/badge";
import { Button } from "@src/shared/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { ProviderResponse } from "../types";

interface UsePaymentProviderColumnsOptions {
  onDelete: (providerId: string) => void;
  isDeleting: boolean;
}

export function usePaymentProviderColumns(
  options: UsePaymentProviderColumnsOptions,
) {
  const { onDelete, isDeleting } = options;

  const columns: ColumnDef<ProviderResponse>[] = [
    {
      accessorKey: "provider",
      header: "Provider",
      cell: ({ row }) => (
        <Link
          href={`/payments/providers/${row.original.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          {row.original.provider}
        </Link>
      ),
    },
    {
      accessorKey: "keyId",
      header: "Key ID",
      cell: ({ row }) => (
        <span className="text-sm font-mono text-muted-foreground">
          {row.original.keyId}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.isActive ? "default" : "secondary"}
          className={row.original.isActive ? "bg-green-600" : ""}
        >
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Added",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/payments/providers/${row.original.id}/edit`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.original.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];
  return { columns };
}
