'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@src/shared/components/ui/button';
import { Input } from '@src/shared/components/ui/input';
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
import { Switch } from '@src/shared/components/ui/switch';
import { ProviderResponse } from '../types';

const PROVIDER_TYPES = ['RAZORPAY', 'STRIPE', 'PAYU', 'CASHFREE'] as const;

interface ProviderFormProps {
  initialData?: ProviderResponse;
  isPending: boolean;
  onSubmit: (data: {
    provider: string;
    keyId: string;
    keySecret: string;
    webhookSecret?: string;
  }) => void;
}

export function ProviderForm({ initialData, isPending, onSubmit }: ProviderFormProps) {
  const isEdit = !!initialData;

  const formSchema = isEdit
    ? z.object({
        keyId: z.string().optional(),
        keySecret: z.string().optional(),
        webhookSecret: z.string().optional(),
      })
    : z.object({
        provider: z.string().min(1, 'Provider type is required'),
        keyId: z.string().min(1, 'Key ID is required'),
        keySecret: z.string().min(1, 'Key secret is required'),
        webhookSecret: z.string().optional(),
      });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...(isEdit ? {} : { provider: '' }),
      keyId: initialData?.keyId ?? '',
      keySecret: '',
      webhookSecret: '',
      isActive: initialData?.isActive ?? true,
    } as FormData,
  });

  const handleSubmit = (data: FormData) => {
    if (isEdit) {
      const payload: Record<string, unknown> = {
        provider: initialData!.provider,
        keyId: data.keyId || initialData!.keyId,
      };

      if (data.keySecret) payload.keySecret = data.keySecret;
      if (data.webhookSecret) payload.webhookSecret = data.webhookSecret;

      onSubmit(payload as Parameters<typeof onSubmit>[0]);
    } else {
      const payload: Record<string, unknown> = {
        provider: (data as { provider: string }).provider,
        keyId: (data as { keyId: string }).keyId,
        keySecret: (data as { keySecret: string }).keySecret,
      };

      if (data.webhookSecret) payload.webhookSecret = data.webhookSecret;

      onSubmit(payload as Parameters<typeof onSubmit>[0]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {!isEdit && (
          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROVIDER_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="keyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key ID</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={isEdit ? 'Leave blank to keep current' : 'Enter key ID'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="keySecret"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key Secret</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder={isEdit ? 'Leave blank to keep current' : 'Enter key secret'}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="webhookSecret"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Webhook Secret</FormLabel>
              <FormControl>
                <Input {...field} type="password" placeholder="Optional" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : isEdit ? 'Update Provider' : 'Add Provider'}
        </Button>
      </form>
    </Form>
  );
}
