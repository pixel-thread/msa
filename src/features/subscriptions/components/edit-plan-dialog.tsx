import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/shared/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@src/shared/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import { Button } from "@src/shared/components/ui/button";
import { useUpdatePlan } from "@src/features/subscriptions/hooks/useUpdatePlan";
import { useMemberTypes } from "@src/features/members/hooks/useMemberTypes";
import { BILLING_CYCLES } from "../utils/constants";
import { SubscriptionPlan } from "../types";

const EditPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  description: z.string(),
  amount: z.number().min(0, "Amount must be non-negative"),
  currency: z.string(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]),
  features: z.record(z.string(), z.any()),
  memberTypeId: z.string().optional(),
});

type EditPlanForm = z.infer<typeof EditPlanSchema>;

interface EditPlanDialogProps {
  plan: SubscriptionPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlanDialog({
  plan,
  open,
  onOpenChange,
}: EditPlanDialogProps) {
  const updatePlan = useUpdatePlan();
  const { memberTypes } = useMemberTypes();

  const form = useForm<EditPlanForm>({
    resolver: zodResolver(EditPlanSchema),
    defaultValues: {
      name: "",
      description: "",
      amount: 0,
      currency: "INR",
      billingCycle: "YEARLY",
      features: {},
      memberTypeId: "",
    },
  });

  useEffect(() => {
    if (plan && open) {
      form.reset({
        name: plan.name,
        description: plan.description || "",
        amount: plan.activeVersion?.amount ?? 0,
        currency: plan.activeVersion?.currency ?? "INR",
        billingCycle: (plan.activeVersion?.billingCycle ?? "YEARLY") as "MONTHLY" | "YEARLY",
        features: (plan.activeVersion?.features as Record<string, unknown>) || {},
        memberTypeId: plan.memberTypeId || "",
      });
    }
  }, [plan, open, form]);

  const onSubmit = (data: EditPlanForm) => {
    if (!plan) return;

    const { memberTypeId, ...rest } = data;
    updatePlan.mutate(
      { planId: plan.id, ...rest, memberTypeId: memberTypeId || undefined },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Edit Subscription Plan</DialogTitle>
          <DialogDescription>
            Update the details of the subscription plan.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Name</FormLabel>
                  <FormControl>
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <input
                        type="number"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Cycle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select billing cycle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BILLING_CYCLES.map((cycle) => (
                          <SelectItem key={cycle} value={cycle}>
                            {cycle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="memberTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member Type (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select member type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {memberTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          Level {type.level}
                          {type.description ? ` - ${type.description}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatePlan.isPending}>
                {updatePlan.isPending ? "Updating..." : "Update Plan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
