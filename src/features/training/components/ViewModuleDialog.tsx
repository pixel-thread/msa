"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, BookOpen } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@src/shared/components/ui/dialog";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@src/shared/components/ui/form";
import type { TrainingModuleListItem } from "../types";
import { RecordCompletionSchema, type RecordCompletionInput } from "../validators/training";
import { useMyCompletions } from "../hooks";

interface ViewModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: TrainingModuleListItem | null;
  isCompleted: boolean;
}

export function ViewModuleDialog({ open, onOpenChange, module, isCompleted }: ViewModuleDialogProps) {
  const { recordSelfCompletion, isCompleting } = useMyCompletions();

  const form = useForm({
    resolver: zodResolver(RecordCompletionSchema),
    defaultValues: {
      certificateUrl: "",
    },
  });

  const onSubmit = (values: RecordCompletionInput) => {
    if (!module) return;

    const formattedValues = {
      certificateUrl: values.certificateUrl || undefined,
    };

    recordSelfCompletion(
      { moduleId: module.id, data: formattedValues },
      {
        onSuccess: (res) => {
          if (res.success) {
            onOpenChange(false);
            form.reset();
          }
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col p-6">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-ink">{module?.title}</h2>
          </div>
          {module?.durationMinutes && (
            <p className="flex items-center gap-1.5 text-xs text-muted mt-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Est. time: {module.durationMinutes} mins</span>
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 space-y-6 py-4 overflow-y-auto max-h-[450px] pr-1">
          {module?.description && (
            <div className="bg-canvas/50 border rounded-lg p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Overview
              </h3>
              <p className="text-sm text-body leading-relaxed">{module.description}</p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              Course Material
            </h3>
            <div className="p-5 border rounded-xl bg-surface-card prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
              {module?.content}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          {isCompleted ? (
            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                You have completed this training module!
              </span>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="certificateUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium">Certificate Link (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/my-certificate.pdf"
                          className="h-10 border-hairline bg-canvas/30"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                  <Button type="submit" disabled={isCompleting}>
                    {isCompleting ? "Recording..." : "Mark as Complete"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
