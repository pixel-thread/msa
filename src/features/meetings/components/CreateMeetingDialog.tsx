"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@src/shared/components/ui/dialog";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@src/shared/components/ui/select";
import type { CreateMeetingForm } from "../types";

interface CreateMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CreateMeetingForm;
  onFormChange: (form: CreateMeetingForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}

export function CreateMeetingDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isPending,
}: CreateMeetingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Meeting</DialogTitle>
          <DialogDescription>
            Create a new meeting for your association.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="Meeting title"
              value={form.title}
              onChange={(e) => onFormChange({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Select
              value={form.type}
              onValueChange={(value) =>
                onFormChange({ ...form, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL_MEETING">General Meeting</SelectItem>
                <SelectItem value="EC_MEETING">EC Meeting</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date & Time</label>
            <Input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) =>
                onFormChange({ ...form, scheduledAt: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Venue (optional)</label>
            <Input
              placeholder="Meeting venue"
              value={form.venue}
              onChange={(e) => onFormChange({ ...form, venue: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Agenda Items (optional)
            </label>
            <textarea
              className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground"
              placeholder="Enter agenda items (one per line)"
              value={form.agendaItems}
              onChange={(e) =>
                onFormChange({ ...form, agendaItems: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function useCreateMeetingForm() {
  const [form, setForm] = useState<CreateMeetingForm>({
    title: "",
    type: "GENERAL_MEETING",
    scheduledAt: "",
    venue: "",
    agendaItems: "",
  });

  const resetForm = () => {
    setForm({
      title: "",
      type: "GENERAL_MEETING",
      scheduledAt: "",
      venue: "",
      agendaItems: "",
    });
  };

  return { form, setForm, resetForm };
}