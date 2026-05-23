"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useMeetingDetail } from "@src/features/meetings/hooks/useMeetingDetail";
import {
  useMeetingMinutes,
  type MeetingMinute as MeetingMinuteType,
} from "@src/features/meetings/hooks/useMeetingMinutes";
import {
  MinutesTable,
  CreateMinuteDialog,
  EditMinuteDialog,
  DeleteMinuteDialog,
} from "@src/features/meetings/components";
import { Button } from "@src/shared/components/ui/button";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import Link from "next/link";
import type {
  CreateMeetingMinuteInput,
  UpdateMeetingMinuteInput,
} from "@src/features/meetings/validators";

export default function MeetingMinutesPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.meetingId as string;

  const [createOpen, setCreateOpen] = useState(false);
  const [editingMinute, setEditingMinute] = useState<MeetingMinuteType | null>(
    null,
  );
  const [deletingMinute, setDeletingMinute] =
    useState<MeetingMinuteType | null>(null);

  const { meeting, isLoading: meetingLoading } = useMeetingDetail(meetingId);
  const {
    minutes,
    isLoading: minutesLoading,
    createMinute,
    updateMinute,
    deleteMinute,
    isCreating,
    isUpdating,
    isDeleting,
  } = useMeetingMinutes(meetingId);

  const handleCreate = (data: CreateMeetingMinuteInput) => {
    createMinute(data);
    setCreateOpen(false);
  };

  const handleUpdate = (data: UpdateMeetingMinuteInput) => {
    if (editingMinute) {
      updateMinute({ minuteId: editingMinute.id, data });
      setEditingMinute(null);
    }
  };

  const handleDelete = () => {
    if (deletingMinute) {
      deleteMinute(deletingMinute.id);
      setDeletingMinute(null);
    }
  };

  if (meetingLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-body">Loading meeting...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-lg text-body">Meeting not found</p>
        <Button
          variant="outline"
          className="mt-4 h-11 border-hairline bg-canvas px-5 text-sm font-medium text-ink hover:bg-surface-strong"
          onClick={() => router.back()}
        >
          Go back
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
              {meeting.title} - Minutes
            </h1>
            <p className="mt-1 text-base text-body">
              Record and manage meeting minutes and decisions
            </p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="h-10">
          <Plus className="mr-2 h-4 w-4" />
          Add Minute
        </Button>
      </div>

      <div className="rounded-xl border border-hairline bg-surface-card">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Meeting Minutes ({minutes.length})
            </h2>
          </div>
          <MinutesTable
            minutes={minutes as MeetingMinuteType[]}
            isLoading={minutesLoading}
            onEdit={(minute) => setEditingMinute(minute as MeetingMinuteType)}
            onDelete={(minute) =>
              setDeletingMinute(minute as MeetingMinuteType)
            }
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Link
          href={`/meetings/${meetingId}`}
          className="text-sm text-primary hover:underline"
        >
          ← Back to Meeting Details
        </Link>
        <Link
          href={`/meetings/${meetingId}/assign`}
          className="text-sm text-primary hover:underline"
        >
          Manage Attendees →
        </Link>
      </div>

      <CreateMinuteDialog
        meetingId={meetingId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
        isPending={isCreating}
      />

      <EditMinuteDialog
        meetingId={meetingId}
        minute={
          editingMinute
            ? {
                ...editingMinute,
                actionItems: editingMinute.actionItems as
                  | {
                      assigneeId?: string;
                      task: string;
                      dueDate?: Date | string;
                    }[]
                  | null,
              }
            : null
        }
        open={!!editingMinute}
        onOpenChange={(open) => {
          if (!open) setEditingMinute(null);
        }}
        onSubmit={handleUpdate}
        isPending={isUpdating}
      />

      <DeleteMinuteDialog
        minute={
          deletingMinute
            ? { id: deletingMinute.id, agendaPoint: deletingMinute.agendaPoint }
            : null
        }
        open={!!deletingMinute}
        onOpenChange={(open) => {
          if (!open) setDeletingMinute(null);
        }}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
