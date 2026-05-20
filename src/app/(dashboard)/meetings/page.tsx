"use client";

import { useState } from "react";
import { DataTable } from "@src/shared/components/data-table";
import { Button } from "@src/shared/components/ui/button";
import { Input } from "@src/shared/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useMeetings } from "@src/features/meetings/hooks";
import { useMeetingTableColumns } from "@src/features/meetings/hooks/useMeetingTableColumns";
import { CreateMeetingDialog } from "@src/features/meetings/components/CreateMeetingDialog";

export default function MeetingsPage() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { meetings, isLoading } = useMeetings();
  const { columns } = useMeetingTableColumns();

  const filteredMeetings = search
    ? meetings.filter(
        (m) =>
          m.title.toLowerCase().includes(search.toLowerCase()) ||
          m.venue?.toLowerCase().includes(search.toLowerCase()),
      )
    : meetings;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Meetings
          </h1>
          <p className="mt-1 text-base text-body">
            Manage and view all association meetings
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="h-11 rounded-full bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-active"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Meeting
        </Button>
      </div>

      <CreateMeetingDialog open={createOpen} onOpenChange={setCreateOpen} />

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-md border-hairline bg-canvas pl-10 text-ink placeholder:text-muted focus-visible:border-primary"
          />
        </div>
      </div>

      <DataTable
        loading={isLoading}
        data={filteredMeetings}
        columns={columns}
      />
    </>
  );
}
