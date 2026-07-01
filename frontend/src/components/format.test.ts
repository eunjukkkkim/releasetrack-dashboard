import { describe, expect, it } from 'vitest';
import { formatDuration } from './format';

describe('formatDuration', () => {
  it('returns a dash for null/undefined', () => {
    expect(formatDuration(null)).toBe('-');
    expect(formatDuration(undefined)).toBe('-');
  });

  it('returns a dash for negative input', () => {
    expect(formatDuration(-5)).toBe('-');
  });

  it('formats sub-minute durations in seconds', () => {
    expect(formatDuration(0)).toBe('0초');
    expect(formatDuration(45)).toBe('45초');
  });

  it('formats minute durations with remaining seconds', () => {
    expect(formatDuration(184)).toBe('3분 4초');
    expect(formatDuration(600)).toBe('10분');
  });

  it('formats hour durations with remaining minutes', () => {
    expect(formatDuration(3600)).toBe('1시간');
    expect(formatDuration(3900)).toBe('1시간 5분');
  });
});
