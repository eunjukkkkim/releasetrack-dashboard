import * as React from 'react';
import { format, isValid, parse } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

/**
 * Atlassian Date / DateTime pickers — shadcn-style triggers (rt-input tone:
 * 40px tall, radius 8px, blue focus) opening a react-day-picker calendar in a
 * Radix popover. DateTimePicker pairs the calendar with a native time input.
 *
 * CONTRACT (load-bearing): both pickers are pure string in / string out and
 * mirror the native inputs they replace EXACTLY, so the consuming pages keep
 * their form state, normalize/fromLocalDateTimeInputValue and submit logic
 * unchanged:
 *  - DatePicker      value/onChange = `yyyy-MM-dd`        (native <input type="date">)
 *  - DateTimePicker  value/onChange = `yyyy-MM-ddTHH:mm`  (native <input type="datetime-local">)
 * Empty string ('') means "no value" → placeholder, and (DateTimePicker) emits
 * '' until a date is chosen — matching native behaviour where a partial
 * date/time produces no value. date-fns handles only the string↔Date mapping.
 */

// ── Pure string conversion helpers (unit-tested in date-picker.test.ts) ──────

/** Parse a `yyyy-MM-dd` string to a local Date, or undefined when empty/invalid. */
export function dateStringToDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : undefined;
}

/** Format a Date to a `yyyy-MM-dd` string (the native date-input value shape). */
export function dateToDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Split a `yyyy-MM-ddTHH:mm` string into its date and time parts (''/'' when empty). */
export function splitDateTime(value: string): { date: string; time: string } {
  if (!value) return { date: '', time: '' };
  const [date = '', time = ''] = value.split('T');
  return { date, time };
}

/**
 * Join a `yyyy-MM-dd` date part and `HH:mm` time part into the native
 * datetime-local value `yyyy-MM-ddTHH:mm`. Returns '' when there is no date
 * (mirrors native datetime-local: time alone yields no value).
 */
export function joinDateTime(date: string, time: string): string {
  if (!date) return '';
  return `${date}T${time || '00:00'}`;
}

/**
 * Derive the time segment a DateTimePicker should display for an external value.
 * Returns the value's `HH:mm` part, or `00:00` when the value is empty/date-only.
 * Used to sync the picker's local time state when `value` changes from the
 * outside — notably so clearing the value to '' also resets a stale time
 * (e.g. a previously typed 14:05 must not linger after an external clear).
 */
export function timeForValue(value: string): string {
  return splitDateTime(value).time || '00:00';
}

export function splitTime(value: string): { hour: string; minute: string } {
  const [hour = '00', minute = '00'] = value.split(':');
  return {
    hour: hour || '00',
    minute: minute || '00',
  };
}

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, minute) => String(minute).padStart(2, '0'));

// ── Shared trigger button (rt-input tone) ────────────────────────────────────

type TriggerButtonProps = {
  display: string;
  placeholder?: string;
  hasValue: boolean;
  ariaLabel?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const TriggerButton = React.forwardRef<HTMLButtonElement, TriggerButtonProps>(
  ({ display, placeholder, hasValue, ariaLabel, className, ...rest }, ref) => (
    // `...rest` MUST be spread so the props Radix's <PopoverTrigger asChild>
    // injects (onClick, onPointerDown, data-state, aria-expanded, aria-controls…)
    // reach the real <button> — otherwise clicking the trigger does nothing and
    // the popover never opens.
    <button
      type="button"
      ref={ref}
      aria-label={ariaLabel}
      className={cn(
        'rt-input flex items-center justify-between gap-2 text-left',
        'focus:border-atlassian-blue focus:shadow-[0_0_0_3px_rgba(24,104,219,0.16)]',
        'disabled:cursor-not-allowed disabled:opacity-55',
        className,
      )}
      {...rest}
    >
      <span className={cn(!hasValue && 'text-muted-indigo')}>{hasValue ? display : placeholder}</span>
      <CalendarIcon className="size-4 shrink-0 opacity-60" />
    </button>
  ),
);
TriggerButton.displayName = 'TriggerButton';

/**
 * Clear (X) affordance shown at the trigger's right edge (left of the calendar
 * icon) when a value is present. Lets the user reset to '' ("전체") without
 * re-opening the calendar to deselect. Sibling of the PopoverTrigger and
 * stops propagation so it never toggles the popover.
 */
function ClearButton({ onClear, label }: { onClear: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClear();
      }}
      className={cn(
        'absolute right-9 top-1/2 z-10 flex size-5 -translate-y-1/2 items-center justify-center',
        'rounded text-muted-indigo opacity-70 transition-opacity hover:opacity-100',
      )}
    >
      <X className="size-3.5" />
    </button>
  );
}

/** Visually-hidden but focusable mirror input so native `required` validation still blocks form submit. */
function RequiredMirror({ value, required }: { value: string; required?: boolean }) {
  if (!required) return null;
  return (
    <input
      tabIndex={-1}
      aria-hidden="true"
      required
      value={value}
      onChange={() => {}}
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
    />
  );
}

// ── DatePicker (yyyy-MM-dd) ──────────────────────────────────────────────────

export interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  'aria-label'?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = '날짜 선택',
  disabled,
  required,
  id,
  'aria-label': ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selected = dateStringToDate(value);

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <TriggerButton
            id={id}
            ariaLabel={ariaLabel}
            display={value}
            placeholder={placeholder}
            hasValue={Boolean(value)}
            disabled={disabled}
          />
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(day) => {
              onChange(day ? dateToDateString(day) : '');
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {value && !required && !disabled && (
        <ClearButton label="날짜 지우기" onClear={() => onChange('')} />
      )}
      <RequiredMirror value={value} required={required} />
    </div>
  );
}

// ── DateTimePicker (yyyy-MM-ddTHH:mm) ────────────────────────────────────────

export interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  'aria-label'?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = '날짜·시각 선택',
  disabled,
  required,
  id,
  'aria-label': ariaLabel,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { date: datePart } = splitDateTime(value);
  // Local time so the user may set the time before (or without) a date.
  const [time, setTime] = React.useState(() => timeForValue(value));

  // Remember the value we emitted ourselves so the sync effect below can ignore
  // it. Without this, manually clearing the time input (which emits `…T00:00`)
  // would snap the field straight back to 00:00 (LOW #4).
  const lastEmitted = React.useRef<string | null>(null);

  const emit = React.useCallback(
    (next: string) => {
      lastEmitted.current = next;
      onChange(next);
    },
    [onChange],
  );

  // Sync local time from external value changes only. An external clear (value
  // → '') resets the time to 00:00 so a stale time never lingers (LOW #3),
  // while our own emissions are skipped to preserve a manually emptied input.
  React.useEffect(() => {
    if (value === lastEmitted.current) return;
    setTime(timeForValue(value));
  }, [value]);

  const selected = dateStringToDate(datePart);
  const display = value ? value.replace('T', ' ') : '';
  const { hour, minute } = splitTime(time);

  const updateTimePart = (nextHour: string, nextMinute: string) => {
    const next = `${nextHour}:${nextMinute}`;
    setTime(next);
    if (datePart) emit(joinDateTime(datePart, next));
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <TriggerButton
            id={id}
            ariaLabel={ariaLabel}
            display={display}
            placeholder={placeholder}
            hasValue={Boolean(value)}
            disabled={disabled}
          />
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(day) => {
              emit(day ? joinDateTime(dateToDateString(day), time) : '');
            }}
          />
          <div className="rt-time-picker-row">
            <span className="rt-time-picker-label">시각</span>
            <div className="rt-time-picker-controls">
              <Select value={hour} onValueChange={(nextHour) => updateTimePart(nextHour, minute)} disabled={disabled}>
                <SelectTrigger className="rt-time-picker-select" aria-label="시 선택">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="rt-time-picker-separator">:</span>
              <Select value={minute} onValueChange={(nextMinute) => updateTimePart(hour, nextMinute)} disabled={disabled}>
                <SelectTrigger className="rt-time-picker-select" aria-label="분 선택">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MINUTES.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {value && !required && !disabled && (
        <ClearButton
          label="날짜 지우기"
          onClear={() => {
            setTime('00:00');
            emit('');
          }}
        />
      )}
      <RequiredMirror value={value} required={required} />
    </div>
  );
}
