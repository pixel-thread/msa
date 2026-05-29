'use client';

import { useState } from 'react';
import { DataTable } from '@src/shared/components/data-table';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { useAssociationsList } from '@src/features/associations/hooks/useAssociationsList';
import { useDeactivateAssociation } from '@src/features/associations/hooks/useDeactivateAssociation';
import { useAssociationColumns } from '@src/features/associations/hooks/useAssociationColumns';
import { SectionHeader } from '@src/shared/components/section-header';
import { CreateAssociationDialog } from '@src/features/associations/components/create-association-dialog';
import { EditAssociationDialog } from '@src/features/associations/components/edit-association-dialog';
import { DeactivateAssociationDialog } from '@src/features/associations/components/deactivate-association-dialog';
import type { Association } from '@src/features/associations/types/association';

export default function AssociationsPage() {
  const [editingAssociation, setEditingAssociation] = useState<Association | null>(null);
  const [deactivatingAssociation, setDeactivatingAssociation] = useState<Association | null>(null);

  const { associations, isLoading } = useAssociationsList();
  const deactivateAssociation = useDeactivateAssociation();

  const { columns } = useAssociationColumns({
    onEdit: setEditingAssociation,
    onDeactivate: setDeactivatingAssociation,
  });

  const handleDeactivateConfirm = () => {
    if (deactivatingAssociation) {
      deactivateAssociation.mutate(deactivatingAssociation.id, {
        onSuccess: () => setDeactivatingAssociation(null),
      });
    }
  };

  return (
    <>
      <SectionHeader
        title="Associations"
        description="Manage associations and their settings"
      >
        <CreateAssociationDialog />
      </SectionHeader>

      <DataTableFilters
        fields={[
          {
            type: 'search',
            id: 'search',
            placeholder: 'Search associations...',
          },
        ]}
        onFilterChange={() => {}}
      />

      <DataTable loading={isLoading} data={associations} columns={columns} />

      <EditAssociationDialog
        association={editingAssociation}
        open={!!editingAssociation}
        onOpenChange={(open) => {
          if (!open) setEditingAssociation(null);
        }}
      />

      <DeactivateAssociationDialog
        association={deactivatingAssociation}
        open={!!deactivatingAssociation}
        onOpenChange={(open) => {
          if (!open) setDeactivatingAssociation(null);
        }}
        onConfirm={handleDeactivateConfirm}
        isDeactivating={deactivateAssociation.isPending}
      />
    </>
  );
}
