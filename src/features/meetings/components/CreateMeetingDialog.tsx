'use client';

import { useFieldArray } from 'react-hook-form';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Plus, Trash } from '@phosphor-icons/react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@src/shared/components/ui/dialog';
import { Button } from '@src/shared/components/ui/button';
import { Input } from '@src/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@src/shared/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@src/shared/components/ui/form';
import {
  FieldSet,
  FieldLegend,
  FieldGroup,
  FieldContent,
  FieldLabel as ShadFieldLabel,
  Field,
} from '@src/shared/components/ui/field';
import { useMeetings } from '../hooks';
import { CreateMeetingSchema, type CreateMeetingInput } from '../validators';
import { zodResolver } from '@hookform/resolvers/zod';

export function CreateMeetingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const form = useForm({
    resolver: zodResolver(CreateMeetingSchema),
    defaultValues: {
      title: '',
      type: 'GENERAL_MEETING',
      scheduledAt: new Date(),
      venue: '',
      agendaItems: [{ title: '', description: '' }],
    },
  });

  const { createMeeting, isCreating: isPending } = useMeetings();

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'agendaItems',
  });

  const onSubmit: SubmitHandler<CreateMeetingInput> = (values) => {
    const formattedData = {
      ...values,
      scheduledAt: values.scheduledAt,
      agendaItems: values.agendaItems
        .filter((item) => item.title.trim())
        .map((item, index) => ({
          order: index + 1,
          title: item.title,
          description: item.description || undefined,
        })),
    };

    createMeeting(formattedData, {
      onSuccess: (data) => {
        if (data.success) {
          onOpenChange(false);
          form.reset({
            title: '',
            type: 'GENERAL_MEETING',
            scheduledAt: new Date(),
            venue: '',
            agendaItems: [{ title: 'Agenda 1', description: '' }],
          });
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Meeting</DialogTitle>
          <DialogDescription>Create a new meeting for your association.</DialogDescription>
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
                    <Input placeholder="Meeting title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col">
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL_MEETING">General Meeting</SelectItem>
                        <SelectItem value="EC_MEETING">EC Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date & Time</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      value={
                        field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ''
                      }
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input placeholder="Meeting venue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FieldSet>
              <FieldLegend>Agenda Items</FieldLegend>
              <FieldGroup>
                {fields.map((fieldItem, index) => (
                  <Field key={fieldItem.id}>
                    <FieldContent>
                      <ShadFieldLabel className="text-xs font-medium">
                        Agenda {index + 1}
                      </ShadFieldLabel>
                      <div className="flex flex-col gap-3 mt-1">
                        <FormField
                          control={form.control}
                          name={`agendaItems.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Agenda item title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`agendaItems.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Description (optional)" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="text-destructive hover:text-destructive gap-1 w-fit"
                          >
                            <Trash className="h-3 w-3" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </FieldContent>
                  </Field>
                ))}
              </FieldGroup>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ title: '', description: '' })}
                className="gap-1 mt-2"
              >
                <Plus className="h-3 w-3" />
                Add Agenda Item
              </Button>
            </FieldSet>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Creating...' : 'Create Meeting'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
