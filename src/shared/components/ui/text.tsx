import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@src/shared/lib/utils';

const textVariants = cva('', {
  variants: {
    variant: {
      'display-mega': 'font-heading text-[80px] leading-[1.0] tracking-[-2px] font-normal',
      'display-xl': 'font-heading text-[64px] leading-[1.0] tracking-[-1.6px] font-normal',
      'display-lg': 'font-heading text-[52px] leading-[1.0] tracking-[-1.3px] font-normal',
      'display-md': 'font-heading text-[44px] leading-[1.09] tracking-[-1px] font-normal',
      'display-sm': 'text-4xl leading-[1.11] tracking-[-0.5px] font-normal',
      'title-lg': 'text-[32px] leading-[1.13] tracking-[-0.4px] font-normal',
      'title-md': 'text-lg leading-[1.33] font-semibold',
      'title-sm': 'text-base leading-[1.25] font-semibold',
      'body-md': 'text-base leading-[1.5] font-normal',
      'body-strong': 'text-base leading-[1.5] font-bold',
      'body-sm': 'text-sm leading-[1.5] font-normal',
      caption: 'text-[13px] leading-[1.5] font-normal',
      'caption-strong': 'text-xs leading-[1.5] font-semibold',
      'number-display': 'font-mono text-lg leading-[1.4] font-medium',
      button: 'text-base leading-[1.15] font-semibold',
      'nav-link': 'text-sm leading-[1.4] font-medium',
    },
    color: {
      default: 'text-foreground',
      ink: 'text-ink',
      body: 'text-body',
      'body-strong': 'text-body-strong',
      muted: 'text-muted-foreground',
      'muted-soft': 'text-muted-soft',
      primary: 'text-primary',
      'on-primary': 'text-on-primary',
      'on-dark': 'text-on-dark',
      'on-dark-soft': 'text-on-dark-soft',
      'semantic-up': 'text-semantic-up',
      'semantic-down': 'text-semantic-down',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
    transform: {
      none: 'normal-case',
      uppercase: 'uppercase',
      lowercase: 'lowercase',
      capitalize: 'capitalize',
    },
  },
  defaultVariants: {
    variant: 'body-md',
  },
});

function Text({
  className,
  variant = 'body-md',
  color,
  align,
  transform,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof textVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="text"
      data-variant={variant}
      className={cn(textVariants({ variant, color, align, transform }), className)}
      {...props}
    />
  );
}

export { Text, textVariants };
