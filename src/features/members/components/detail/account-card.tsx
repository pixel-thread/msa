import { Card, CardHeader, CardTitle, CardContent } from '@src/shared/components/ui/card';
import { formatDate } from '@src/shared/utils';
import type { User } from '@src/shared/types';

interface AccountCardProps {
  member: User;
}

export function AccountCard({ member }: AccountCardProps) {
  return (
    <Card className=" border-hairline bg-surface-card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-body">Created</span>
            <span className="text-sm text-ink">{formatDate(member.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-body">Updated</span>
            <span className="text-sm text-ink">{formatDate(member.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
