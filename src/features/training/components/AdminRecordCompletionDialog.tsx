"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import { AdminRecordCompletionSchema, type AdminRecordCompletionInput } from "../validators/training";
import { useMembers } from "@src/features/members/hooks/useMembers";
import { useTrainingModules, useAdminCompletions } from "../hooks";

interface AdminRecordCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminRecordCompletionDialog({ open, onOpenChange }: AdminRecordCompletionDialogProps) {
  const { recordAdminCompletion, isRecording } = useAdminCompletions();
  const { members, isLoading: isMembersLoading } = useMembers({ status: "ACTIVE" });
  const { modules, isLoading: isModulesLoading } = useTrainingModules({ isActive: true });

  const form = useForm({
    resolver: zodResolver(AdminRecordCompletionSchema),
    defaultValues: {
      userId: "",
      moduleId: "",
      scorePercent: undefined,
      certificateUrl: "",
    },
  });

  const onSubmit = (values: AdminRecordCompletionInput) => {
    // If certificateUrl is empty string, pass undefined to satisfy validator
    const formattedValues = {
      ...values,
      certificateUrl: values.certificateUrl || undefined,
    };

    recordAdminCompletion(formattedValues, {
      onSuccess: (res) => {
        if (res.success) {
          onOpenChange(false);
          form.reset();
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Training Completion</DialogTitle>
          <DialogDescription>
            Manually log a training module completion for an association member.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isMembersLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isMembersLoading ? "Loading members..." : "Select a member"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} ({member.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="moduleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Module</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isModulesLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isModulesLoading ? "Loading modules..." : "Select a module"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {modules.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scorePercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Score Percentage (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 85"
                      min={0}
                      max={100}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="certificateUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificate URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/certificate.pdf"
                      {...field}
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
              <Button type="submit" disabled={isRecording}>
                {isRecording ? "Recording..." : "Record Completion"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
