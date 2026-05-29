'use client';

import { useCreateProvider } from '@src/features/payments/hooks/usePaymentProviders';
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

interface CreateProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProviderDialog({ open, onOpenChange }: CreateProviderDialogProps) {
  const queryClient = useQueryClient();
  const createProvider = useCreateProvider();

  const handleSubmit = (data: {
    provider: string;
    keyId: string;
    keySecret: string;
    webhookSecret?: string;
  }) => {
    createProvider.mutate(data, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(response.message || 'Provider added successfully');
          queryClient.invalidateQueries({ queryKey: ['payment-providers'] });
          onOpenChange(false);
        } else {
          toast.error(response.message || 'Failed to add provider');
        }
      },
      onError: () => {
        toast.error('Failed to add provider');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Provider</DialogTitle>
          <DialogDescription>Configure a new payment gateway integration</DialogDescription>
        </DialogHeader>
        {open && (
          <ProviderForm key="create" isPending={createProvider.isPending} onSubmit={handleSubmit} />
        )}
      </DialogContent>
    </Dialog>
  );
}
