"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { DataTable } from "@src/shared/components/data-table";
import { SubscriptionsPagination } from "@src/features/subscriptions/components/subscriptions-pagination";
import { usePlans } from "@src/features/subscriptions/hooks/usePlans";
import { usePlanTableColumns } from "@src/features/subscriptions/hooks/usePlanTableColumns";
import { usePlanTableActions } from "@src/features/subscriptions/hooks/usePlanTableActions";
import { CreatePlanDialog } from "@src/features/subscriptions/components/create-plan-dialog";
import { EditPlanDialog } from "@src/features/subscriptions/components/edit-plan-dialog";
import { DeletePlanDialog } from "@src/features/subscriptions/components/delete-plan-dialog";
import { SubscriptionPlan } from "@src/features/subscriptions/types";

export default function PlansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);

  const { plans, meta, isLoading } = usePlans({ page: currentPage });
  const { onStatusChange, onDelete, isPending } = usePlanTableActions();
  const { columns } = usePlanTableColumns({
    onStatusChange,
    onDelete: (planId: string) => {
      const plan = plans.find((p) => p.id === planId);
      if (plan) setDeletingPlan(plan);
    },
    onEdit: (plan: SubscriptionPlan) => setEditingPlan(plan),
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/subscriptions/plans?${params.toString()}`);
  };

  const handleDeleteConfirm = () => {
    if (deletingPlan) {
      onDelete(deletingPlan.id);
      setDeletingPlan(null);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Subscription Plans
          </h1>
          <p className="mt-1 text-base text-body">
            Manage subscription plans for your association
          </p>
        </div>
        <CreatePlanDialog />
      </div>

      <DataTable loading={isLoading} data={plans} columns={columns} />

      {meta && (
        <SubscriptionsPagination
          meta={meta}
          onPageChange={handlePageChange}
          label="plans"
        />
      )}

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
