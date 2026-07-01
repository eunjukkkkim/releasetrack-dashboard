import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Atlassian Select — Radix composite. 앱 전역의 필터/서비스 선택 컨트롤로 사용된다
 * (DeploymentList·ServiceList 필터, PipelineCard·DashboardCharts의 카드 헤더 셀렉트 등).
 *
 * Trigger mirrors the Input look (radius 8px, hairline border, blue focus ring);
 * content is a white popover (radius 8px, navy micro-shadow) with blue-tint
 * hover/active items. Styled with Tailwind utilities backed by the @theme tokens
 * in index.css.
 *
 * Contract reminders for consumers:
 *  - `value` is always a string; cast numeric ids with String()/Number().
 *  - Radix forbids an empty `value=""` on SelectItem — use the "__ALL" sentinel
 *    for the "전체"/"선택" option and convert at the call site.
 *  - The card-header control height/width is opt-in via `className="rt-card-control"`.
 */
/**
 * Sentinel for the "전체"/"선택" (empty) option. Radix forbids `value=""` on a
 * SelectItem, so empty filters bind this value and convert back to '' / undefined
 * at the call site. Shared so every consumer uses the identical constant.
 */
export const SELECT_ALL = '__ALL';

/**
 * Pure sentinel converters for empty ("전체") filter Selects. Radix forbids
 * `value=""` on a SelectItem, so empty filter state ('' or undefined) is mapped to
 * the SELECT_ALL sentinel for the Root, and mapped back to '' on selection. The
 * consuming filter then treats '' as undefined (no filter) exactly as before.
 *
 * Extracted as pure functions so the conversion is unit-testable without rendering
 * Radix (no jsdom pointer-capture issues), and so every filter shares one impl.
 */
export function toSelectValue(raw: string | undefined): string {
  return raw == null || raw === '' ? SELECT_ALL : raw;
}

export function fromSelectValue(val: string): string {
  return val === SELECT_ALL ? '' : val;
}

/**
 * Numeric-id Select binding (DeploymentCreate service, PipelineCard pipeline
 * service). Keeps the control *controlled* with '' when nothing is selected (which
 * shows the placeholder), avoiding the uncontrolled→controlled transition warning
 * that `value={id ? String(id) : undefined}` produced. A falsy id (0/null/undefined)
 * means "unselected"; valid ids round-trip back via Number() at the call site.
 */
export function numberToSelectValue(id: number | null | undefined): string {
  return id ? String(id) : '';
}

export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex min-h-10 w-full items-center justify-between gap-2 rounded-input border border-hairline bg-white px-3 py-2 text-sm text-midnight-navy outline-none',
      'rt-select-trigger',
      'data-[placeholder]:text-muted-indigo',
      'focus:border-atlassian-blue focus:shadow-[0_0_0_3px_rgba(24,104,219,0.16)]',
      'disabled:cursor-not-allowed disabled:opacity-55',
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-4 opacity-60" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUp className="size-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

export const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDown className="size-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-input border border-hairline bg-white text-midnight-navy shadow-[var(--shadow-navy)]',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 text-xs font-medium text-muted-indigo', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-[6px] py-1.5 pl-8 pr-2 text-sm outline-none',
      'rt-select-item',
      'focus:bg-fog-white focus:text-midnight-navy data-[state=checked]:bg-blue-tint data-[state=checked]:font-semibold data-[state=checked]:text-atlassian-blue',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-fog-white', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
