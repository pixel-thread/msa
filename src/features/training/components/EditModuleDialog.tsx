'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserRole } from '@prisma/client';

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
import { Textarea } from '@src/shared/components/ui/textarea';
import { Switch } from '@src/shared/components/ui/switch';
import { Checkbox } from '@src/shared/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@src/shared/components/ui/form';
import type { TrainingModuleListItem } from '../types';
import { UpdateTrainingModuleSchema, type UpdateTrainingModuleInput } from '../validators/training';
import { useUpdateTrainingModule } from '../hooks';

interface EditModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: TrainingModuleListItem | null;
}

const ROLES_LIST = Object.values(UserRole);

export function EditModuleDialog({ open, onOpenChange, module }: EditModuleDialogProps) {
  const { updateModule, isUpdating } = useUpdateTrainingModule();

  const form = useForm({
    resolver: zodResolver(UpdateTrainingModuleSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      durationMinutes: undefined,
      requiredForRoles: [UserRole.MEMBER],
      isActive: true,
    },
  });

  useEffect(() => {
    if (module) {
      form.reset({
        title: module.title,
        description: module.description || '',
        content: module.content,
        durationMinutes: module.durationMinutes || undefined,
        requiredForRoles: (module.requiredForRoles as UserRole[]) || [UserRole.MEMBER],
        isActive: module.isActive,
      });
    }
  }, [module, form]);

  const onSubmit = (values: UpdateTrainingModuleInput) => {
    if (!module) return;

    updateModule(
      { moduleId: module.id, data: values },
      {
        onSuccess: (res) => {
          if (res.success) {
            onOpenChange(false);
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Training Module</DialogTitle>
          <DialogDescription>Update the training module information.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Module title" {...field} />
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Short description of the module"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Training Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add detailed training content, instructions, or links here..."
                      className="min-h-30"
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
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (Minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g. 30"
                        {...field}
                        value={field.value ?? ''}
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
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Active</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="requiredForRoles"
              render={() => (
                <FormItem className="flex flex-col gap-2">
                  <FormLabel>Required for Roles</FormLabel>
                  <div className="grid grid-cols-2 gap-2 p-3 border bg-card/50">
                    {ROLES_LIST.map((role) => (
                      <FormField
                        key={role}
                        control={form.control}
                        name="requiredForRoles"
                        render={({ field }) => {
                          const isChecked = field.value?.includes(role) ?? false;
                          return (
                            <div className="flex items-center gap-2 space-y-0">
                              <Checkbox
                                id={`edit-role-${role}`}
                                checked={isChecked}
                                onCheckedChange={(checked) => {
                                  const updatedRoles = checked
                                    ? [...(field.value || []), role]
                                    : (field.value || []).filter((r) => r !== role);
                                  field.onChange(updatedRoles);
                                }}
                              />
                              <label
                                htmlFor={`edit-role-${role}`}
                                className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {role}
                              </label>
                            </div>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
