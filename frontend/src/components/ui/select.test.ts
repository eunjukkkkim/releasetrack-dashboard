import { describe, expect, it } from 'vitest';
import {
  SELECT_ALL,
  fromSelectValue,
  numberToSelectValue,
  toSelectValue,
} from './select';

/**
 * Pure-function regression guard for the SELECT_ALL sentinel conversion used by the
 * empty ("전체") filter Selects (DeploymentList service/environment/status,
 * ServiceList status) and the numeric service Selects (DeploymentCreate,
 * PipelineCard pipeline). No Radix rendering — no jsdom pointer-capture issues.
 */
describe('toSelectValue', () => {
  it('maps empty string to the SELECT_ALL sentinel', () => {
    expect(toSelectValue('')).toBe(SELECT_ALL);
  });

  it('maps undefined to the SELECT_ALL sentinel', () => {
    expect(toSelectValue(undefined)).toBe(SELECT_ALL);
  });

  it('preserves a non-empty value unchanged', () => {
    expect(toSelectValue('PRODUCTION')).toBe('PRODUCTION');
    expect(toSelectValue('5')).toBe('5');
  });

  it('never returns the empty string the Radix Root rejects', () => {
    expect(toSelectValue('')).not.toBe('');
    expect(toSelectValue(undefined)).not.toBe('');
  });
});

describe('fromSelectValue', () => {
  it('maps the SELECT_ALL sentinel back to empty string', () => {
    expect(fromSelectValue(SELECT_ALL)).toBe('');
  });

  it('preserves a real value unchanged', () => {
    expect(fromSelectValue('STAGING')).toBe('STAGING');
    expect(fromSelectValue('5')).toBe('5');
  });
});

describe('sentinel round trip', () => {
  it('empty -> sentinel -> empty (filter "전체" keeps undefined semantics)', () => {
    expect(fromSelectValue(toSelectValue(''))).toBe('');
    expect(fromSelectValue(toSelectValue(undefined))).toBe('');
  });

  it('real value -> sentinel-mapped value -> real value', () => {
    expect(fromSelectValue(toSelectValue('PRODUCTION'))).toBe('PRODUCTION');
    expect(fromSelectValue(toSelectValue('5'))).toBe('5');
  });
});

describe('numberToSelectValue', () => {
  it('stringifies a valid numeric id (controlled, round-trips via Number)', () => {
    expect(numberToSelectValue(5)).toBe('5');
    expect(Number(numberToSelectValue(5))).toBe(5);
    expect(Number(numberToSelectValue(42))).toBe(42);
  });

  it('treats falsy ids (0 / null / undefined) as the controlled empty placeholder state', () => {
    expect(numberToSelectValue(0)).toBe('');
    expect(numberToSelectValue(null)).toBe('');
    expect(numberToSelectValue(undefined)).toBe('');
  });
});
