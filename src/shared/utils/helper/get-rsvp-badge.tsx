import { Badge } from '@src/shared/components/ui/badge';

export const getRsvpBadge = (status: string | null) => {
  if (!status) return <Badge variant="outline">Pending</Badge>;
  const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
    ACCEPTED: 'default',
    DECLINED: 'destructive',
    PENDING: 'secondary',
  };
  return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
};
