import { Badge } from '@src/shared/components/ui/badge';

export const getTypeBadge = (type: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
    GENERAL_MEETING: 'default',
    EC_MEETING: 'secondary',
    SPECIAL_MEETING: 'outline',
  };
  return <Badge variant={variants[type] || 'outline'}>{type.replace('_', ' ')}</Badge>;
};
