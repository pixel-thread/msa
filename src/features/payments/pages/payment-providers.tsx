"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  usePaymentProviders,
  useDeleteProvider,
} from "@src/features/payments/hooks/usePaymentProviders";
import { DataTable } from "@src/shared/components/data-table";
import { usePaymentProviderColumns } from "@src/features/payments/hooks/usePaymentProviderColumns";
import { Button } from "@src/shared/components/ui/button";
import { Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/shared/components/ui/dialog";

export default function PaymentProvidersPage() {
  const router = useRouter();
  const { providers, isLoading } = usePaymentProviders();
  const deleteProvider = useDeleteProvider();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (providerId: string) => {
    setDeletingId(providerId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    deleteProvider.mutate(deletingId, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(response.message || "Provider deleted successfully");
        } else {
          toast.error(response.message || "Failed to delete provider");
        }
        setDeleteDialogOpen(false);
        setDeletingId(null);
      },
      onError: () => {
        toast.error("Failed to delete provider");
        setDeleteDialogOpen(false);
        setDeletingId(null);
      },
    });
  };

  const { columns } = usePaymentProviderColumns({
    onDelete: handleDelete,
    isDeleting: deleteProvider.isPending,
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Payment Providers
          </h1>
          <p className="mt-1 text-base text-body">
            Manage payment gateway integrations (Razorpay, Stripe, etc.)
          </p>
        </div>
        <Button
          onClick={() => router.push("/payments/providers/new")}
          className="h-10"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Provider
        </Button>
      </div>

      <div className=" border border-hairline bg-surface-card">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Provider Configurations ({providers.length})
            </h2>
          </div>
          <DataTable columns={columns} data={providers} loading={isLoading} />
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment provider? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteProvider.isPending}
            >
              {deleteProvider.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
