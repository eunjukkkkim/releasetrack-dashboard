import type { ReactNode } from 'react';
import { Input } from './input';
import { Textarea } from './textarea';
import { Label } from './label';
import { cn } from '../../lib/utils';

/**
 * Form aggregator. Input/Textarea/Label live in their own shadcn-style files
 * (ui/input.tsx, ui/textarea.tsx, ui/label.tsx) and are re-exported here so
 * existing `import { Field, Input, Textarea } from '../ui/form'` statements keep
 * working unchanged.
 *
 * Wave 2 note: the native `<select>` previously exported here has been removed —
 * every page now uses the Radix composite Select in ui/select.tsx.
 */
export { Input, Textarea, Label };

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rt-field', className)}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
