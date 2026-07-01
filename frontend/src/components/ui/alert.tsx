import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Atlassian Alert — shadcn-style composite (Alert + AlertTitle +
 * AlertDescription). cva maps to the existing `.rt-alert*` classes so the
 * tones (default / warning / danger) and DOM are preserved. The props-based
 * `Alert({ title, description, variant })` in ui/state.tsx wraps this composite.
 */
export const alertVariants = cva('rt-alert', {
  variants: {
    variant: {
      default: '',
      warning: 'rt-alert-warning',
      danger: 'rt-alert-danger',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rt-alert-title', className)} {...props} />;
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rt-alert-description', className)} {...props} />;
}
