import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DatePicker, DateTimePicker } from './date-picker';

/**
 * Regression guard: the trigger MUST forward Radix's injected props (onClick,
 * aria-expanded…) so clicking actually opens the popover. A trigger that drops
 * `...rest` compiles and passes the pure-helper tests but renders a dead button.
 */
describe('DatePicker / DateTimePicker trigger wiring', () => {
  it('DatePicker opens the popover when the trigger is clicked', () => {
    render(<DatePicker value="" onChange={() => {}} aria-label="시작일" />);
    const trigger = screen.getByRole('button', { name: '시작일' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('DateTimePicker opens the popover when the trigger is clicked', () => {
    render(<DateTimePicker value="" onChange={() => {}} aria-label="배포 일시" />);
    const trigger = screen.getByRole('button', { name: '배포 일시' });
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('DatePicker clear button resets the value to empty', () => {
    const onChange = vi.fn();
    render(<DatePicker value="2026-06-30" onChange={onChange} aria-label="시작일" />);
    fireEvent.click(screen.getByRole('button', { name: '날짜 지우기' }));
    expect(onChange).toHaveBeenCalledWith('');
  });
});
