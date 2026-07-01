import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { TopDeployedServiceResponse } from '../../api/types';
import {
  TopDeployedServiceChart,
  statusAccentColor,
  topDeployBarWidth,
} from './DashboardHome';

afterEach(cleanup);

describe('topDeployBarWidth', () => {
  it('returns 100 for the maximum value', () => {
    expect(topDeployBarWidth(40, 40)).toBe(100);
  });

  it('returns the proportional percentage relative to the max', () => {
    expect(topDeployBarWidth(10, 40)).toBe(25);
  });

  it('returns 0 when max is 0 to avoid division by zero', () => {
    expect(topDeployBarWidth(0, 0)).toBe(0);
  });

  it('clamps results into the 0~100 range', () => {
    expect(topDeployBarWidth(50, 40)).toBe(100);
    expect(topDeployBarWidth(-5, 40)).toBe(0);
  });
});

describe('TopDeployedServiceChart', () => {
  const rows: TopDeployedServiceResponse[] = [
    {
      serviceId: 1,
      serviceName: 'checkout-api',
      deploymentCount: 7,
      successCount: 4,
      failedCount: 2,
      inProgressCount: 1,
    },
    {
      serviceId: 2,
      serviceName: 'billing-worker',
      deploymentCount: 3,
      successCount: 3,
      failedCount: 0,
      inProgressCount: 0,
    },
  ];

  const renderChart = (data: TopDeployedServiceResponse[]) =>
    render(
      <MemoryRouter>
        <TopDeployedServiceChart rows={data} />
      </MemoryRouter>,
    );

  it('renders the 3-segment legend (성공 / 실패·롤백 / 진행 중)', () => {
    renderChart(rows);
    expect(screen.getByText('성공')).toBeTruthy();
    expect(screen.getByText('실패·롤백')).toBeTruthy();
    expect(screen.getByText('진행 중')).toBeTruthy();
  });

  it('preserves the service → /services/{id} link', () => {
    renderChart(rows);
    const link = screen.getByRole('link', { name: 'checkout-api' });
    expect(link.getAttribute('href')).toBe('/services/1');
  });

  it('exposes per-segment counts via the accessible bar label', () => {
    renderChart(rows);
    const bar = screen.getByLabelText(
      'checkout-api 배포 7회 (성공 4 · 실패·롤백 2 · 진행 중 1)',
    );
    // 스택 세그먼트는 값이 0 인 버킷을 건너뛰므로 성공/실패/진행중 3개만 렌더된다.
    expect(bar.querySelectorAll('.rt-bar-seg')).toHaveLength(3);
  });

  it('omits zero-count segments (billing-worker: success only)', () => {
    renderChart([rows[1]]);
    const bar = screen.getByLabelText(
      'billing-worker 배포 3회 (성공 3 · 실패·롤백 0 · 진행 중 0)',
    );
    expect(bar.querySelectorAll('.rt-bar-seg')).toHaveLength(1);
  });

  it('shows the empty state when there are no rows', () => {
    renderChart([]);
    expect(screen.getByText('배포 이력이 있는 서비스가 없습니다.')).toBeTruthy();
  });
});

describe('statusAccentColor', () => {
  it('maps each deployment status to its badge-tone accent', () => {
    expect(statusAccentColor('SUCCESS')).toBe('#1f845a');
    expect(statusAccentColor('FAILED')).toBe('#de350b');
    expect(statusAccentColor('ROLLED_BACK')).toBe('#fca700');
    expect(statusAccentColor('RUNNING')).toBe('#1868db');
    expect(statusAccentColor('QUEUED')).toBe('#6b778c');
  });

  it('returns an empty string when there is no deployment (null status)', () => {
    expect(statusAccentColor(null)).toBe('');
  });
});
