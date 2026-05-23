"use client";

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

const CompleteAssignmentSchema = z.object({
  scorePercent: z.number().min(0).max(100).optional(),
});

type CompleteAssignmentInput = z.infer<typeof CompleteAssignmentSchema>;

interface CompleteAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  moduleId: string;
  onComplete: (data: { userId: string; scorePercent?: number }) => void;
  isCompleting: boolean;
}

export function CompleteAssignmentDialog({
  open,
  onOpenChange,
  userId,
  userName,
  moduleId,
  onComplete,
  isCompleting,
}: CompleteAssignmentDialogProps) {
  const form = useForm({
    resolver: zodResolver(CompleteAssignmentSchema),
    defaultValues: {
      scorePercent: undefined,
    },
  });

  const onSubmit = (values: CompleteAssignmentInput) => {
    onComplete({ userId, scorePercent: values.scorePercent });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Training as Completed</DialogTitle>
          <DialogDescription>
            Record completion for {userName} and optionally award points (score).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className=" bg-surface-secondary p-4">
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

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCompleting}>
                {isCompleting ? "Recording..." : "Mark as Completed"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
