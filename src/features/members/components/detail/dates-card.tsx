import { Card, CardHeader, CardTitle, CardContent } from '@src/shared/components/ui/card';
import { Calendar } from 'lucide-react';
import { formatDate } from '@src/shared/utils';
import type { User } from '@src/shared/types';

interface DatesCardProps {
  member: User;
}

export function DatesCard({ member }: DatesCardProps) {
  return (
    <Card className=" border-hairline bg-surface-card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Dates
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Joined MFSA</p>
              <p className="text-sm text-ink">
                {member.dateOfJoiningAssociation
                  ? formatDate(member.dateOfJoiningAssociation)
                  : 'Not set'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Joined Govt</p>
              <p className="text-sm text-ink">
                {member.dateOfJoiningGovt ? formatDate(member.dateOfJoiningGovt) : 'Not set'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
