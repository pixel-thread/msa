import { ArrowLeftIcon } from 'lucide-react';
import { cn } from '@src/shared/lib/utils';
import { Button } from '@src/shared/components/ui/button';

interface SectionHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  titleBadges?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
  onBackClick?: () => void;
}

export function SectionHeader({
  title,
  description,
  titleBadges,
  children,
  className,
  as: Tag = 'h1',
  onBackClick,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="flex items-center gap-4 min-w-0 flex-1">
        {onBackClick && (
          <Button variant="ghost" size="icon" onClick={onBackClick}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <Tag className="text-[36px] font-normal leading-tight tracking-tight text-ink">
              {title}
            </Tag>
            {titleBadges}
          </div>
          {description && <p className="mt-1 text-base text-body">{description}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-3 shrink-0">{children}</div>}
    </div>
  );
}
