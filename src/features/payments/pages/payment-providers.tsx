'use client';

import { useState } from 'react';
import {
  usePaymentProviders,
  useDeleteProvider,
} from '@src/features/payments/hooks/usePaymentProviders';
import { DataTable } from '@src/shared/components/data-table';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { usePaymentProviderColumns } from '@src/features/payments/hooks/usePaymentProviderColumns';
import { Button } from '@src/shared/components/ui/button';
import { SectionHeader } from '@src/shared/components/section-header';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@src/shared/components/ui/dialog';
import { CreateProviderDialog } from '../components/create-provider-dialog';
import { EditProviderDialog } from '../components/edit-provider-dialog';
import { ProviderDetailDialog } from '../components/provider-detail-dialog';

export default function PaymentProvidersPage() {
  const { providers, isLoading } = usePaymentProviders();
  const deleteProvider = useDeleteProvider();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const handleDelete = (providerId: string) => {
    setDeletingId(providerId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    deleteProvider.mutate(deletingId, {
      onSuccess: (response) => {
        if (response.success) {
          toast.success(response.message || 'Provider deleted successfully');
        } else {
          toast.error(response.message || 'Failed to delete provider');
        }
        setDeleteDialogOpen(false);
        setDeletingId(null);
      },
      onError: () => {
        toast.error('Failed to delete provider');
        setDeleteDialogOpen(false);
        setDeletingId(null);
      },
    });
  };

  const { columns } = usePaymentProviderColumns({
    onEdit: (id) => setEditingId(id),
    onViewDetail: (id) => setDetailId(id),
    onDelete: handleDelete,
    isDeleting: deleteProvider.isPending,
  });

  return (
    <>
      <SectionHeader
        title="Payment Providers"
        description="Manage payment gateway integrations (Razorpay, Stripe, etc.)"
      >
        <Button onClick={() => setCreateDialogOpen(true)} className="h-10">
          <Plus className="mr-2 h-4 w-4" />
          Add Provider
        </Button>
      </SectionHeader>

      <DataTableFilters
        fields={[
          {
            type: 'search',
            id: 'search',
            placeholder: 'Search providers...',
          },
        ]}
        onFilterChange={() => {}}
      />
      <DataTable columns={columns} data={providers} loading={isLoading} />

      <CreateProviderDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <EditProviderDialog
        open={!!editingId}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
        providerId={editingId ?? ''}
      />

      <ProviderDetailDialog
        open={!!detailId}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        providerId={detailId ?? ''}
        onEdit={(id) => {
          setDetailId(null);
          setEditingId(id);
        }}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment provider? This action cannot be undone.
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
              {deleteProvider.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
