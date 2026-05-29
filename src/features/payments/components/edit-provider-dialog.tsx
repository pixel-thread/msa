'use client';

import {
  useProviderDetail,
  useUpdateProvider,
} from '@src/features/payments/hooks/usePaymentProviders';
import { ProviderForm } from '@src/features/payments/components/provider-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface EditProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
}

export function EditProviderDialog({ open, onOpenChange, providerId }: EditProviderDialogProps) {
  const queryClient = useQueryClient();
  const { provider, isLoading } = useProviderDetail(providerId);
  const updateProvider = useUpdateProvider(providerId);

  const handleSubmit = (data: {
    provider: string;
    keyId: string;
    keySecret: string;
    webhookSecret?: string;
  }) => {
    updateProvider.mutate(data, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(response.message || 'Provider updated successfully');
          queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
          onOpenChange(false);
        } else {
          toast.error(response.message || 'Failed to update provider');
        }
      },
      onError: () => {
        toast.error('Failed to update provider');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Provider</DialogTitle>
          <DialogDescription>Update payment provider configuration</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-body">Loading provider...</p>
          </div>
        ) : !provider ? (
          <p className="text-body">Provider not found</p>
        ) : (
          open && (
            <ProviderForm
              key={providerId}
              initialData={provider}
              isPending={updateProvider.isPending}
              onSubmit={handleSubmit}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
