import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Atlassian Textarea — Input tone, min-h 96px, resize-y. Maps to
 * `.rt-input .rt-textarea`; the `rows` prop continues to work.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn('rt-input rt-textarea', className)} {...props} />
  ),
);
Textarea.displayName = 'Textarea';
