import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Atlassian Badge — full pill, Inter 13px/500, soft semantic fills.
 * The 11 semantic variants are the data-viz status palette used by StatusTag /
 * EnvironmentTag (SUCCESS/FAILED/ROLLED_BACK/RUNNING/QUEUED → success/danger/
 * warning/info/muted; ACTIVE/ARCHIVED/MAINTENANCE → success/inactive/
 * maintenance; DEV/STAGING/PRODUCTION → dev/staging/production). cva emits the
 * existing `.rt-badge*` classes so StatusTag tests (rt-badge-danger, …) and the
 * styled tones are preserved exactly. Semantic colors are for data views only.
 */
export const badgeVariants = cva('rt-badge', {
  variants: {
    variant: {
      default: 'rt-badge-default',
      success: 'rt-badge-success',
      warning: 'rt-badge-warning',
      danger: 'rt-badge-danger',
      info: 'rt-badge-info',
      muted: 'rt-badge-muted',
      maintenance: 'rt-badge-maintenance',
      inactive: 'rt-badge-inactive',
      production: 'rt-badge-production',
      staging: 'rt-badge-staging',
      dev: 'rt-badge-dev',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

export function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : 'span';
  return <Comp className={cn(badgeVariants({ variant }), className)} {...props} />;
}
