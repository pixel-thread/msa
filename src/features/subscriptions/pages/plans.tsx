'use client';

import { useState } from 'react';
import { useUrlFilters } from '@src/shared/hooks';

import { DataTable } from '@src/shared/components/data-table';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { DataTablePagination } from '@src/shared/components/data-table-pagination';
import { usePlans } from '@src/features/subscriptions/hooks/usePlans';
import { usePlanTableColumns } from '@src/features/subscriptions/hooks/usePlanTableColumns';
import { usePlanTableActions } from '@src/features/subscriptions/hooks/usePlanTableActions';
import { SectionHeader } from '@src/shared/components/section-header';
import { CreatePlanDialog } from '@src/features/subscriptions/components/create-plan-dialog';
import { EditPlanDialog } from '@src/features/subscriptions/components/edit-plan-dialog';
import { DeletePlanDialog } from '@src/features/subscriptions/components/delete-plan-dialog';
import { SubscriptionPlan } from '@src/features/subscriptions/types';

export default function PlansPage() {
  const { page, setPage } = useUrlFilters({ basePath: '/subscriptions/plans' });
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);

  const { plans, meta, isLoading } = usePlans({ page });
  const { onStatusChange, onDelete, onSetDefault, isPending } = usePlanTableActions();
  const { columns } = usePlanTableColumns({
    onStatusChange,
    onSetDefault,
    onDelete: (planId: string) => {
      const plan = plans.find((p) => p.id === planId);
      if (plan) setDeletingPlan(plan);
    },
    onEdit: (plan: SubscriptionPlan) => setEditingPlan(plan),
  });

  const handleDeleteConfirm = () => {
    if (deletingPlan) {
      onDelete(deletingPlan.id);
      setDeletingPlan(null);
    }
  };

  return (
    <>
      <SectionHeader
        title="Subscription Plans"
        description="Manage subscription plans for your association"
      >
        <CreatePlanDialog />
      </SectionHeader>

      <DataTableFilters
        fields={[
          {
            type: 'search',
            id: 'search',
            placeholder: 'Search plans...',
          },
        ]}
        onFilterChange={() => {}}
      />

      <DataTable loading={isLoading} data={plans} columns={columns} />

      <DataTablePagination meta={meta} onPageChange={setPage} label="plans" />

      <EditPlanDialog
        plan={editingPlan}
        open={!!editingPlan}
        onOpenChange={(open) => {
          if (!open) setEditingPlan(null);
        }}
      />

      <DeletePlanDialog
        plan={deletingPlan}
        open={!!deletingPlan}
        onOpenChange={(open) => {
          if (!open) setDeletingPlan(null);
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={isPending}
      />
    </>
  );
}
