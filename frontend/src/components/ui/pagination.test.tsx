import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TablePagination } from './pagination';

afterEach(cleanup);

function getButton(label: string) {
  return screen.getByRole('link', { name: new RegExp(label) }) as HTMLAnchorElement;
}

describe('Pagination', () => {
  it('disables the previous button on the first page and enables next', () => {
    render(
      <TablePagination
        page={0}
        totalPages={3}
        totalElements={45}
        first
        last={false}
        onPrev={() => undefined}
        onNext={() => undefined}
        onPageChange={() => undefined}
      />,
    );
    expect(getButton('이전').getAttribute('aria-disabled')).toBe('true');
    expect(getButton('다음').getAttribute('aria-disabled')).toBe(null);
    expect(getButton('1').getAttribute('aria-current')).toBe('page');
    expect(getButton('2')).not.toBeNull();
    expect(getButton('3')).not.toBeNull();
  });

  it('disables the next button on the last page and enables previous', () => {
    render(
      <TablePagination
        page={2}
        totalPages={3}
        totalElements={45}
        first={false}
        last
        onPrev={() => undefined}
        onNext={() => undefined}
        onPageChange={() => undefined}
      />,
    );
    expect(getButton('이전').getAttribute('aria-disabled')).toBe(null);
    expect(getButton('다음').getAttribute('aria-disabled')).toBe('true');
    expect(getButton('3').getAttribute('aria-current')).toBe('page');
  });

  it('invokes the handlers when enabled buttons are clicked', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onPageChange = vi.fn();
    render(
      <TablePagination
        page={1}
        totalPages={3}
        totalElements={45}
        first={false}
        last={false}
        onPrev={onPrev}
        onNext={onNext}
        onPageChange={onPageChange}
      />,
    );
    fireEvent.click(getButton('이전'));
    fireEvent.click(getButton('다음'));
    fireEvent.click(getButton('3'));
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
