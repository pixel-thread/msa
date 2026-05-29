import { Card, CardHeader, CardTitle, CardContent } from '@src/shared/components/ui/card';
import type { User } from '@src/shared/types';

interface ActivityCardProps {
  member: User & { _count?: { meetingAttendances?: number } };
}

export function ActivityCard({ member }: ActivityCardProps) {
  return (
    <Card className=" border-hairline bg-surface-card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-body">Meeting Attendance</span>
            <span className="text-sm font-medium text-ink">
              {member._count?.meetingAttendances || 0}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
