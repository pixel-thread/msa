'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@src/shared/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@src/shared/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import { Button } from '@src/shared/components/ui/button';
import { Input } from '@src/shared/components/ui/input';
import { Plus } from 'lucide-react';
import { useCreatePlan } from '@src/features/subscriptions/hooks/useCreatePlan';
import { useMemberTypes } from '@src/features/members/hooks/useMemberTypes';
import { BILLING_CYCLES } from '../utils/constants';
import { CreateSubscriptionPlanInput, CreateSubscriptionPlanSchema } from '../validators';
import { logger } from '@src/shared/logger';

export function CreatePlanDialog() {
  const [open, setOpen] = useState(false);
  const createPlan = useCreatePlan();
  const { memberTypes } = useMemberTypes();

  const form = useForm({
    resolver: zodResolver(CreateSubscriptionPlanSchema),
    defaultValues: {
      name: '',
      description: '',
      amount: 0,
      currency: 'INR',
      billingCycle: 'YEARLY',
      features: {},
      memberTypeId: '',
      isActive: true,
      effectiveFrom: '',
    },
  });

  const onSubmit = (data: CreateSubscriptionPlanInput) => {
    const { memberTypeId, isActive, ...rest } = data;
    createPlan.mutate(
      {
        ...rest,
        memberTypeId: memberTypeId || undefined,
        isActive: isActive ?? true,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            setOpen(false);
            form.reset();
          }
        },
      },
    );
  };

  logger.debug('Create Subscription Plan Dialog', {
    error: form.formState.errors,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Create Subscription Plan</DialogTitle>
          <DialogDescription>
            Add a new subscription plan for your association members.
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
                    <Input type="text" {...field} />
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
                      className="flex min-h-[80px] w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effectiveTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective To</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().slice(0, 16)
                          : typeof field.value === 'string'
                            ? field.value.slice(0, 16)
                            : ''
                      }
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      name={field.name}
                      disabled={field.disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="effectiveFrom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Effective From</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={
                        field.value instanceof Date
                          ? field.value.toISOString().slice(0, 16)
                          : typeof field.value === 'string'
                            ? field.value.slice(0, 16)
                            : ''
                      }
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      ref={field.ref}
                      name={field.name}
                      disabled={field.disabled}
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
                      <Input
                        type="number"
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
                          {type.description ? ` - ${type.description}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPlan.isPending}>
                {createPlan.isPending ? 'Creating...' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
