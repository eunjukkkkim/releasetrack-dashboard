import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EmptyBox, ErrorBox, LoadingBox } from './StateBox';

afterEach(cleanup);

describe('StateBox', () => {
  it('renders a spinner for the loading state', () => {
    const { container } = render(<LoadingBox />);
    expect(container.querySelector('.rt-spinner')).not.toBeNull();
  });

  it('renders the provided description for the empty state', () => {
    render(<EmptyBox description="배포 이력이 없습니다." />);
    expect(screen.getByText('배포 이력이 없습니다.')).not.toBeNull();
  });

  it('surfaces the error message via getErrorMessage', () => {
    render(<ErrorBox error={new Error('네트워크 오류')} />);
    expect(screen.getByText('데이터를 불러오지 못했습니다.')).not.toBeNull();
    expect(screen.getByText('네트워크 오류')).not.toBeNull();
  });
});
