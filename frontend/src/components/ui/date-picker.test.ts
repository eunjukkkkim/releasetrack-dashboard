import { describe, expect, it } from 'vitest';
import {
  dateStringToDate,
  dateToDateString,
  joinDateTime,
  splitDateTime,
  splitTime,
  timeForValue,
} from './date-picker';

/**
 * Pure-function regression guard for the date/datetime string conversion used by
 * DatePicker (yyyy-MM-dd) and DateTimePicker (yyyy-MM-ddTHH:mm). These guarantee
 * the pickers are byte-for-byte in/out compatible with the native date /
 * datetime-local inputs they replace, so the backend payload format is preserved
 * (DeploymentList from/to filter, DeploymentCreate/Detail deployedAt/started/finished).
 * No Radix/day-picker rendering — no jsdom issues.
 */
describe('DatePicker string conversion (yyyy-MM-dd)', () => {
  it('round-trips a date string through Date and back unchanged', () => {
    const parsed = dateStringToDate('2026-06-30');
    expect(parsed).toBeInstanceOf(Date);
    expect(dateToDateString(parsed as Date)).toBe('2026-06-30');
  });

  it('treats empty string as no value (undefined)', () => {
    expect(dateStringToDate('')).toBeUndefined();
  });

  it('returns undefined for an invalid date string', () => {
    expect(dateStringToDate('not-a-date')).toBeUndefined();
  });
});

describe('DateTimePicker string conversion (yyyy-MM-ddTHH:mm)', () => {
  it('splits a native datetime-local value into date and time parts', () => {
    expect(splitDateTime('2026-06-30T14:05')).toEqual({ date: '2026-06-30', time: '14:05' });
  });

  it('splits empty value into empty parts', () => {
    expect(splitDateTime('')).toEqual({ date: '', time: '' });
  });

  it('joins date and time back into the native datetime-local shape', () => {
    expect(joinDateTime('2026-06-30', '14:05')).toBe('2026-06-30T14:05');
  });

  it('round-trips split→join without changing the string', () => {
    const value = '2026-12-01T09:30';
    const { date, time } = splitDateTime(value);
    expect(joinDateTime(date, time)).toBe(value);
  });

  it('emits no value when there is no date (matches native partial behaviour)', () => {
    expect(joinDateTime('', '14:05')).toBe('');
  });

  it('defaults the time to 00:00 when a date has no time', () => {
    expect(joinDateTime('2026-06-30', '')).toBe('2026-06-30T00:00');
  });
});

describe('DateTimePicker external-value time sync (timeForValue)', () => {
  it('uses the value time segment when present', () => {
    expect(timeForValue('2026-06-30T14:05')).toBe('14:05');
  });

  it('resets to 00:00 when the value is cleared externally (no stale time)', () => {
    expect(timeForValue('')).toBe('00:00');
  });

  it('falls back to 00:00 for a date-only value', () => {
    expect(timeForValue('2026-06-30')).toBe('00:00');
  });
});

describe('DateTimePicker local time select state (splitTime)', () => {
  it('splits HH:mm state for the hour and minute selects', () => {
    expect(splitTime('14:05')).toEqual({ hour: '14', minute: '05' });
  });

  it('falls back to 00 for empty time segments', () => {
    expect(splitTime('')).toEqual({ hour: '00', minute: '00' });
  });
});
