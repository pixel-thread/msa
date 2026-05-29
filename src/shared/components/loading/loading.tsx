import { Spinner } from '@src/shared/components/ui/spinner';
import { cn } from '@src/shared/lib/utils';

interface LoadingProps {
  fullScreen?: boolean;
  label?: string;
  className?: string;
}

function Loading({ fullScreen = true, label, className }: LoadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen && 'fixed inset-0',
        className,
      )}
      role="status"
      aria-label={label ?? 'Loading'}
    >
      <Spinner className="size-8" />
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}

export { Loading };
