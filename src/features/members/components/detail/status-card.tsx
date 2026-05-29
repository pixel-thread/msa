import { Card, CardHeader, CardTitle, CardContent } from '@src/shared/components/ui/card';
import { Badge } from '@src/shared/components/ui/badge';
import type { User } from '@src/shared/types';
import { getStatusBadge } from '@src/shared/utils/helper/get-status-badge';

interface StatusCardProps {
  member: User;
}

export function StatusCard({ member }: StatusCardProps) {
  const roles = Array.isArray(member.role) ? member.role : [member.role];

  return (
    <Card className=" border-hairline bg-surface-card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-body">Status</span>
            {getStatusBadge(member.status)}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-body">Roles</span>
            <div className="flex flex-wrap gap-1 justify-end">
              {roles.map((role) => (
                <Badge key={role} variant="outline" className="text-xs">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
