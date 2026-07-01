import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

/**
 * Atlassian Label — muted indigo #42526e, Inter 13px/500. Backed by Radix Label
 * (htmlFor association now possible) but renders the existing `.rt-label` class
 * so the visual is unchanged.
 */
export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn('rt-label', className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;
