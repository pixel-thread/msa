import { Card, CardHeader, CardTitle, CardContent } from '@src/shared/components/ui/card';
import type { User } from '@src/shared/types';

interface PaymentsCardProps {
  member: User & {
    _count?: { payments?: number };
    lastPaymentDate?: string;
    hasPaid?: boolean;
  };
}

export function PaymentsCard({ member }: PaymentsCardProps) {
  return (
    <Card className=" border-hairline bg-surface-card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Payments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-body">Total Payments</span>
            <span className="text-sm font-medium text-ink">{member._count?.payments || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
