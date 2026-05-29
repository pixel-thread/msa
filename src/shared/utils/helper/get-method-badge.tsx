import { Badge } from '@src/shared/components/ui/badge';

export const getMethodBadge = (method: string | null) => {
  if (!method) return null;
  return (
    <Badge variant="outline" className="capitalize">
      {method.toLowerCase().replace('_', ' ')}
    </Badge>
  );
};
