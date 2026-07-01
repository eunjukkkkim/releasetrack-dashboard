import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Atlassian Input — radius 8px, 1px hairline border, blue focus ring, min-h 40px.
 * Maps to the `.rt-input` class (DESIGN.md tokens) so all existing form usages
 * (text/date/datetime-local) render unchanged.
 */
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input type={type} ref={ref} className={cn('rt-input', className)} {...props} />
  ),
);
Input.displayName = 'Input';
