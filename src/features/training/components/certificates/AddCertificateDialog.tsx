'use client';

import { useCallback, useState } from 'react';
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
import { Paperclip, X } from 'lucide-react';
import { useCreateTrainingCertificate } from '../../hooks';
import {
  CreateTrainingCertificateSchema,
  CreateTrainingCertificateInput,
} from '../../validators/training';

interface AddCertificateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
}

export function AddCertificateDialog({ open, onOpenChange, moduleId }: AddCertificateDialogProps) {
  const { mutate: createCertificate, isPending } = useCreateTrainingCertificate(moduleId);

  const [file, setFile] = useState<File | null>(null);

  const form = useForm({
    resolver: zodResolver(CreateTrainingCertificateSchema),
    defaultValues: {
      userId: '',
      certificateNumber: '',
      issuedAt: '',
    },
  });

  const handleClose = useCallback(() => {
    form.reset();
    setFile(null);
    onOpenChange(false);
  }, [form, onOpenChange]);

  const onSubmit = (values: CreateTrainingCertificateInput) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(values));

    createCertificate(formData, {
      onSuccess: (res) => {
        if (res.success) {
          form.reset();
          setFile(null);
          onOpenChange(false);
        }
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Certificate</DialogTitle>
          <DialogDescription>Upload a certificate file and assign it to a user.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter user UUID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="certificateNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. CERT-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issuedAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issued Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Certificate File</FormLabel>
              <FormControl>
                {file ? (
                  <div className="flex items-center justify-between border border-hairline bg-canvas px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-sm text-body truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-hairline bg-canvas px-3 py-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                    <Paperclip className="h-4 w-4" />
                    Choose file
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="sr-only"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !file}>
                {isPending ? 'Adding...' : 'Add Certificate'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
