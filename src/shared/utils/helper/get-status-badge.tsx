import { Badge } from '@components/ui/badge';

export const getStatusBadge = (status: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    SCHEDULED: 'default',
    IN_PROGRESS: 'secondary',
    COMPLETED: 'outline',
    CANCELLED: 'destructive',
  };
  return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
};
