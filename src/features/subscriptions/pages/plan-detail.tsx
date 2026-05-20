"use client";

import { useParams, useRouter } from "next/navigation";

import { usePlans } from "@src/features/subscriptions/hooks/usePlans";
import { Button } from "@src/shared/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@src/shared/components/ui/card";
import { Badge } from "@src/shared/components/ui/badge";
import { Separator } from "@src/shared/components/ui/separator";
import { formatDate } from "@src/shared/utils";

export function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  const { plans, isLoading } = usePlans();
  const plan = plans.find((p) => p.id === planId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading plan details...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-lg text-body">Plan not found</p>
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

  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: plan.currency,
    maximumFractionDigits: 0,
  }).format(plan.amount);

  return (
    <>
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            {plan.name}
          </h1>
          <p className="mt-1 text-base text-body">
            Subscription plan details
          </p>
        </div>
        <Badge variant={plan.isActive ? "default" : "secondary"} className="ml-2">
          {plan.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-xl border-hairline bg-surface-card md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
              Plan Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {plan.description && (
                <>
                  <div>
                    <p className="text-xs font-medium text-muted">Description</p>
                    <p className="text-sm text-ink mt-1">{plan.description}</p>
                  </div>
                  <Separator className="bg-hairline" />
                </>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted">Amount</p>
                  <p className="text-lg font-medium text-ink mt-1">
                    {formattedAmount}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted">Billing Cycle</p>
                  <p className="text-sm text-ink mt-1 capitalize">
                    {plan.billingCycle.toLowerCase()}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted">Currency</p>
                  <p className="text-sm text-ink mt-1">{plan.currency}</p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted">Effective From</p>
                  <p className="text-sm text-ink mt-1">
                    {formatDate(plan.effectiveFrom)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-xl border-hairline bg-surface-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
                Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              {plan.features && Object.keys(plan.features).length > 0 ? (
                <ul className="space-y-2">
                  {Object.entries(plan.features).map(([key, value]) => (
                    <li key={key} className="text-sm text-ink">
                      <span className="font-medium">{key}:</span>{" "}
                      {String(value)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No features defined</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-hairline bg-surface-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted">
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted">Created</p>
                  <p className="text-sm text-ink mt-1">
                    {formatDate(plan.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted">Last Updated</p>
                  <p className="text-sm text-ink mt-1">
                    {formatDate(plan.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
