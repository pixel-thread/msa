'use client';

import { useRouter } from 'next/navigation';
import { CalendarIcon as Calendar } from '@phosphor-icons/react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@src/shared/components/ui/card';
import { DataTable } from '@src/shared/components/data-table';
import { DataTableFilters } from '@src/shared/components/data-table-filters';
import { useMeetingTableColumns } from '../hooks/useMeetingTableColumns';
import { useMeetings } from '../hooks';

export function MeetingsTable() {
  const router = useRouter();
  const { columns } = useMeetingTableColumns();
  const { meetings } = useMeetings();

  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">All Meetings</CardTitle>
            <CardDescription className="text-sm">
              Total of {meetings.length} meetings in your association
            </CardDescription>
          </div>
          <div className="h-9 w-9 bg-emerald-500/10 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-emerald-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No meetings scheduled</p>
          </div>
        ) : (
          <>
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

            <DataTable data={meetings || []} columns={[]} loading={false} meta={{ router }} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
