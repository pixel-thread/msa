import { cn } from '@src/shared/lib/utils';
import { HugeiconsIcon } from '@hugeicons/react';
import { Loading03Icon } from '@hugeicons/core-free-icons';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <HugeiconsIcon
      icon={Loading03Icon}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      strokeWidth={2 as any}
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
