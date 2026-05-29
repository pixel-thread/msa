'use client';

import { useState } from 'react';
import { useUrlFilters } from '@src/shared/hooks';
import { DataTable } from '@src/shared/components/data-table';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { Button } from '@src/shared/components/ui/button';
import { SectionHeader } from '@src/shared/components/section-header';
import { Plus } from 'lucide-react';
import { useMeetings } from '@src/features/meetings/hooks';
import { useMeetingTableColumns } from '@src/features/meetings/hooks/useMeetingTableColumns';
import { CreateMeetingDialog } from '@src/features/meetings/components/CreateMeetingDialog';
import { DataTablePagination } from '@src/shared/components/data-table-pagination';

export default function MeetingsPage() {
  const { page, setPage } = useUrlFilters({ basePath: '/meetings' });

  const [createOpen, setCreateOpen] = useState(false);

  const { meetings, meta, isLoading } = useMeetings({
    page,
  });
  const { columns } = useMeetingTableColumns();

  return (
    <>
      <SectionHeader
        title="Meetings"
        description="Manage and view all association meetings"
      >
        <Button onClick={() => setCreateOpen(true)} variant={'default'}>
          <Plus className="mr-2 h-4 w-4" />
          Create Meeting
        </Button>
      </SectionHeader>

      <CreateMeetingDialog open={createOpen} onOpenChange={setCreateOpen} />

      <DataTableFilters
        fields={[
          {
            type: 'search',
            id: 'search',
            placeholder: 'Search meetings...',
          },
        ]}
        onFilterChange={() => {}}
      />

      <DataTable loading={isLoading} data={meetings} columns={columns} />

      <DataTablePagination meta={meta} onPageChange={setPage} />
    </>
  );
}
