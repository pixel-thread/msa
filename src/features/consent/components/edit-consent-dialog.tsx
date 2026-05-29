'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useUpdateConsentReceipt } from '../hooks/useUpdateConsentReceipt';
import {
  UpdateConsentReceiptSchema,
  UpdateConsentReceiptInput,
} from '../validators/consent.validators';
import { ConsentStatus } from '@prisma/client';
import type { ConsentRecord } from '../types/consent.types';

interface EditConsentDialogProps {
  record: ConsentRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditConsentDialog({ record, open, onOpenChange }: EditConsentDialogProps) {
  const updateConsentReceipt = useUpdateConsentReceipt();

  const form = useForm<UpdateConsentReceiptInput>({
    resolver: zodResolver(UpdateConsentReceiptSchema),
    defaultValues: {
      status: undefined,
      channel: undefined,
    },
  });

  useEffect(() => {
    if (open && record) {
      form.reset({
        status: record.status ?? undefined,
        channel: (record.channel as 'web' | 'mobile' | 'email') ?? undefined,
      });
    }
  }, [open, record, form]);

  const onSubmit = (data: UpdateConsentReceiptInput) => {
    if (!record) return;
    updateConsentReceipt.mutate(
      { id: record.id, data },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      },
    );
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Consent Receipt</DialogTitle>
          <DialogDescription>
            Update the status or channel for this consent receipt
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ConsentStatus.GRANTED}>Granted</SelectItem>
                        <SelectItem value={ConsentStatus.WITHDRAWN}>Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Channel</FormLabel>
                  <FormControl>
                    <Select value={field.value ?? ''} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web">Web</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateConsentReceipt.isPending}>
                {updateConsentReceipt.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
