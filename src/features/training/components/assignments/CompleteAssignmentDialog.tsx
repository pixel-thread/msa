'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { RadioGroup, RadioGroupItem } from '@src/shared/components/ui/radio-group';
import { Label } from '@src/shared/components/ui/label';
import { Paperclip, X, Globe, Upload, Ban } from 'lucide-react';

const CompleteAssignmentSchema = z.object({
  scorePercent: z.number().min(0).max(100).optional(),
  certificateOption: z.enum(['none', 'global', 'custom']).default('none'),
});

type CompleteAssignmentInput = z.infer<typeof CompleteAssignmentSchema>;

interface CompleteAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  moduleId: string;
  certificateTemplate: {
    id: string;
    certificateUrl: string;
    name: string;
  } | null;
  onComplete: (data: {
    userId: string;
    scorePercent?: number;
    certificateOption?: 'none' | 'global' | 'custom';
    certificateFile?: File | null;
  }) => void;
  isCompleting: boolean;
}

export function CompleteAssignmentDialog({
  open,
  onOpenChange,
  userId,
  userName,
  moduleId,
  certificateTemplate,
  onComplete,
  isCompleting,
}: CompleteAssignmentDialogProps) {
  const [certFile, setCertFile] = useState<File | null>(null);

  const form = useForm({
    resolver: zodResolver(CompleteAssignmentSchema),
    defaultValues: {
      scorePercent: undefined,
      certificateOption: certificateTemplate ? 'global' : 'none',
    },
  });

  const certOption = form.watch('certificateOption');

  const onSubmit = (values: CompleteAssignmentInput) => {
    onComplete({
      userId,
      scorePercent: values.scorePercent,
      certificateOption: certFile ? 'custom' : values.certificateOption,
      certificateFile: certFile,
    });
    onOpenChange(false);
    form.reset();
    setCertFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Training as Completed</DialogTitle>
          <DialogDescription>
            Record completion for {userName} and optionally issue a certificate.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="bg-surface-secondary p-4">
              <p className="text-sm text-body">
                <span className="font-medium text-ink">User:</span> {userName}
              </p>
              <p className="text-sm text-body mt-1">
                <span className="font-medium text-ink">Module ID:</span> {moduleId}
              </p>
            </div>

            <FormField
              control={form.control}
              name="scorePercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points / Score (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 100"
                      min={0}
                      max={100}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="certificateOption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={certFile ? 'custom' : field.value}
                      onValueChange={(val) => {
                        if (val !== 'custom') {
                          setCertFile(null);
                        }
                        field.onChange(val);
                      }}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2 border border-hairline rounded-md p-3">
                        <RadioGroupItem value="none" id="cert-none" />
                        <Label
                          htmlFor="cert-none"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Ban className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-sm font-medium">No certificate</span>
                            <p className="text-xs text-muted-foreground">
                              Mark complete without issuing a certificate
                            </p>
                          </div>
                        </Label>
                      </div>

                      {certificateTemplate && (
                        <div className="flex items-center space-x-2 border border-hairline rounded-md p-3">
                          <RadioGroupItem value="global" id="cert-global" />
                          <Label
                            htmlFor="cert-global"
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Globe className="h-4 w-4 text-primary" />
                            <div>
                              <span className="text-sm font-medium">Use template certificate</span>
                              <p className="text-xs text-muted-foreground">
                                {certificateTemplate.name}
                              </p>
                            </div>
                          </Label>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 border border-hairline rounded-md p-3">
                        <RadioGroupItem value="custom" id="cert-custom" />
                        <Label
                          htmlFor="cert-custom"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Upload className="h-4 w-4 text-primary" />
                          <div>
                            <span className="text-sm font-medium">Upload custom certificate</span>
                            <p className="text-xs text-muted-foreground">
                              Upload a personalized certificate file
                            </p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {certOption === 'custom' || certFile ? (
              <FormItem>
                <FormLabel>Certificate File</FormLabel>
                <FormControl>
                  {certFile ? (
                    <div className="flex items-center justify-between border border-hairline bg-canvas px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm text-body truncate">{certFile.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          ({(certFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setCertFile(null);
                          form.setValue('certificateOption', 'none');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-hairline bg-canvas px-3 py-4 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      <Paperclip className="h-4 w-4" />
                      Choose certificate file
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setCertFile(file);
                          if (file) {
                            form.setValue('certificateOption', 'custom');
                          }
                        }}
                      />
                    </label>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            ) : null}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCompleting}>
                {isCompleting ? 'Recording...' : 'Mark as Completed'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
