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
} from '@src/shared/components/ui/dialog';
import { Button } from '@src/shared/components/ui/button';
import { Input } from '@src/shared/components/ui/input';
import { Label } from '@src/shared/components/ui/label';
import { Textarea } from '@src/shared/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { CreateMeetingMinuteSchema, type CreateMeetingMinuteInput } from '../validators/minutes';

interface ActionItemInput {
  assigneeId?: string;
  task: string;
  dueDate?: Date | string;
}

interface CreateMinuteDialogProps {
  meetingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateMeetingMinuteInput) => void;
  isPending: boolean;
}

export function CreateMinuteDialog({
  meetingId,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: CreateMinuteDialogProps) {
  const [actionItems, setActionItems] = useState<ActionItemInput[]>([]);

  const form = useForm({
    resolver: zodResolver(CreateMeetingMinuteSchema),
    defaultValues: {
      agendaPoint: '',
      decision: '',
    },
  });

  const handleAddActionItem = () => {
    setActionItems([...actionItems, { assigneeId: '', task: '', dueDate: '' }]);
  };

  const handleRemoveActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleActionItemChange = (index: number, field: string, value: string) => {
    const updated = [...actionItems];
    updated[index] = { ...updated[index], [field]: value };
    setActionItems(updated);
  };

  const handleSubmit = form.handleSubmit((data) => {
    const filteredItems = actionItems.filter((item) => item.task.trim());
    const formattedItems = filteredItems.map((item) => ({
      assigneeId: item.assigneeId || undefined,
      task: item.task,
      dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
    }));
    onSubmit({
      agendaPoint: data.agendaPoint,
      decision: data.decision,
      actionItems: formattedItems.length > 0 ? formattedItems : undefined,
    });
    form.reset();
    setActionItems([]);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Meeting Minute</DialogTitle>
          <DialogDescription>Record a decision or action item from the meeting.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="agendaPoint">Agenda Point *</Label>
              <Input
                id="agendaPoint"
                {...form.register('agendaPoint')}
                placeholder="e.g., Budget approval for Q2"
              />
              {form.formState.errors.agendaPoint && (
                <p className="text-sm text-red-500">{form.formState.errors.agendaPoint.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="decision">Decision *</Label>
              <Textarea
                id="decision"
                {...form.register('decision')}
                placeholder="Describe the decision made..."
                rows={3}
              />
              {form.formState.errors.decision && (
                <p className="text-sm text-red-500">{form.formState.errors.decision.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Action Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddActionItem}
                  className="h-8"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Item
                </Button>
              </div>

              {actionItems.length > 0 && (
                <div className="space-y-3">
                  {actionItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 border border-hairline p-3">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Task description *"
                          value={item.task}
                          onChange={(e) => handleActionItemChange(index, 'task', e.target.value)}
                          className="h-8"
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder="Assignee ID (optional)"
                            value={item.assigneeId}
                            onChange={(e) =>
                              handleActionItemChange(index, 'assigneeId', e.target.value)
                            }
                            className="h-8 flex-1"
                          />
                          <Input
                            type="date"
                            value={
                              typeof item.dueDate === 'string'
                                ? item.dueDate
                                : item.dueDate
                                  ? new Date(item.dueDate).toISOString().split('T')[0]
                                  : ''
                            }
                            onChange={(e) =>
                              handleActionItemChange(index, 'dueDate', e.target.value)
                            }
                            className="h-8 w-[160px]"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => handleRemoveActionItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                form.reset();
                setActionItems([]);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Adding...' : 'Add Minute'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
