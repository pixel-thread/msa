"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  useProviderDetail,
  useDeleteProvider,
} from "@src/features/payments/hooks/usePaymentProviders";
import { ProviderDetail } from "@src/features/payments/components/provider-detail";
import { Button } from "@src/shared/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/shared/components/ui/dialog";

export function PaymentProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params.providerId as string;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { provider, isLoading } = useProviderDetail(providerId);
  const deleteProvider = useDeleteProvider();

  const handleDelete = () => {
    deleteProvider.mutate(providerId, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(response.message || "Provider deleted successfully");
        } else {
          toast.error(response.message || "Failed to delete provider");
        }
        setDeleteDialogOpen(false);
        router.push("/payments/providers");
      },
      onError: () => {
        toast.error("Failed to delete provider");
        setDeleteDialogOpen(false);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading provider details...</p>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-lg text-body">Provider not found</p>
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

  return (
    <>
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            {provider.provider}
          </h1>
          <p className="mt-1 text-base text-body capitalize">
            Payment provider configuration
          </p>
        </div>
      </div>

      <ProviderDetail
        provider={provider}
        onDelete={() => setDeleteDialogOpen(true)}
        isDeleting={deleteProvider.isPending}
      />

      <div className="mt-4">
        <Button variant="outline" onClick={() => router.push("/payments/providers")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Providers
        </Button>
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
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
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
