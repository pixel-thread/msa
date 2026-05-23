"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useProviderDetail,
  useCreateProvider,
  useUpdateProvider,
} from "@src/features/payments/hooks/usePaymentProviders";
import { ProviderForm } from "@src/features/payments/components/provider-form";
import { Button } from "@src/shared/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export function PaymentProviderFormPage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params.providerId as string | undefined;
  const isEdit = !!providerId;

  const { provider, isLoading } = useProviderDetail(providerId);
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider(providerId ?? "");

  const handleSubmit = (data: {
    provider: string;
    keyId: string;
    keySecret: string;
    webhookSecret?: string;
    isActive?: boolean;
  }) => {
    if (isEdit) {
      updateProvider.mutate(data, {
        onSuccess: (response) => {
          if (response.success) {
            toast.success("Provider updated successfully");
          } else {
            toast.error(response.message || "Failed to update provider");
          }
          router.push(`/payments/providers/${providerId}`);
        },
        onError: () => {
          toast.error("Failed to update provider");
        },
      });
    } else {
      createProvider.mutate(data, {
        onSuccess: (response) => {
          if (response.success) {
            toast.success("Provider added successfully");
          } else {
            toast.error(response.message || "Failed to add provider");
          }
          router.push("/payments/providers");
        },
        onError: () => {
          toast.error("Failed to add provider");
        },
      });
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading provider...</p>
      </div>
    );
  }

  if (isEdit && !provider) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-lg text-body">Provider not found</p>
        <Button
          variant="outline"
          className="mt-4 h-11 border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
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
            {isEdit ? "Edit Provider" : "Add Provider"}
          </h1>
          <p className="mt-1 text-base text-body">
            {isEdit
              ? "Update payment provider configuration"
              : "Configure a new payment gateway integration"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card p-6 max-w-xl">
        <ProviderForm
          initialData={provider ?? undefined}
          isPending={createProvider.isPending || updateProvider.isPending}
          onSubmit={handleSubmit}
        />
      </div>

      <div className="mt-4">
        <Button
          variant="outline"
          onClick={() =>
            isEdit
              ? router.push(`/payments/providers/${providerId}`)
              : router.push("/payments/providers")
          }
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </>
  );
}
