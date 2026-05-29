import { Badge } from '@src/shared/components/ui/badge';

export const getPlanStatusBadge = (status: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    ACTIVE: 'default',
    INACTIVE: 'secondary',
  };
  return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
};
