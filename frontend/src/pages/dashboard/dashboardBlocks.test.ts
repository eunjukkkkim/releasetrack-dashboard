import { describe, expect, it } from 'vitest';
import type { DashboardSummaryResponse } from '../../api/types';
import {
  DASHBOARD_BLOCKS,
  elapsedDaysDisplay,
  hasTrendData,
  inProgressBreakdown,
  mergeLayout,
  pairDashboardBlocks,
  reorder,
  resolveInitialServiceId,
  selectStatusStats,
  selectStatusTrend,
  statusCount,
  visibleBlockIds,
  type DashboardBlock,
} from './dashboardBlocks';

const defaultOrderIds = [
  'pipeline',
  'trend',
  'statusDist',
  'recentFailed',
  'serviceStatus',
  'recentDeployments',
  'topDeployed',
];

describe('mergeLayout', () => {
  it('falls back to registry default order/visibility when nothing is stored', () => {
    const layout = mergeLayout(DASHBOARD_BLOCKS, null);
    expect(layout.order).toEqual(defaultOrderIds);
    // topDeployed 는 디자인에 없어 기본 숨김.
    expect(layout.hidden).toEqual(['topDeployed']);
  });

  it('keeps topDeployed last and hidden by default (디자인 정렬)', () => {
    const layout = mergeLayout(DASHBOARD_BLOCKS, null);
    expect(layout.order[layout.order.length - 1]).toBe('topDeployed');
    expect(layout.hidden).toContain('topDeployed');
  });

  it('preserves a valid stored order and normalizes hidden', () => {
    const stored = { order: ['stale', 'trend', 'pipeline'], hidden: ['trend'] };
    const blocks: DashboardBlock[] = [
      { id: 'pipeline', label: 'p', defaultVisible: true, defaultOrder: 1 },
      { id: 'trend', label: 't', defaultVisible: true, defaultOrder: 2 },
      { id: 'stale', label: 's', defaultVisible: true, defaultOrder: 3 },
    ];
    const layout = mergeLayout(blocks, stored);
    expect(layout.order).toEqual(['stale', 'trend', 'pipeline']);
    expect(layout.hidden).toEqual(['trend']);
  });

  it('ignores unknown (deleted) block ids in stored order and hidden', () => {
    const stored = { order: ['pipeline', 'ghost', 'trend'], hidden: ['ghost'] };
    const blocks: DashboardBlock[] = [
      { id: 'pipeline', label: 'p', defaultVisible: true, defaultOrder: 1 },
      { id: 'trend', label: 't', defaultVisible: true, defaultOrder: 2 },
    ];
    const layout = mergeLayout(blocks, stored);
    expect(layout.order).toEqual(['pipeline', 'trend']);
    expect(layout.hidden).toEqual([]);
  });

  it('auto-appends new registry blocks by defaultOrder and honors defaultVisible=false', () => {
    const stored = { order: ['pipeline'], hidden: [] };
    const blocks: DashboardBlock[] = [
      { id: 'pipeline', label: 'p', defaultVisible: true, defaultOrder: 1 },
      { id: 'newer', label: 'n', defaultVisible: true, defaultOrder: 3 },
      { id: 'hiddenNew', label: 'h', defaultVisible: false, defaultOrder: 2 },
    ];
    const layout = mergeLayout(blocks, stored);
    expect(layout.order).toEqual(['pipeline', 'hiddenNew', 'newer']);
    expect(layout.hidden).toEqual(['hiddenNew']);
  });
});

describe('visibleBlockIds', () => {
  it('drops hidden ids while preserving order', () => {
    expect(visibleBlockIds({ order: ['a', 'b', 'c'], hidden: ['b'] })).toEqual(['a', 'c']);
  });
});

describe('pairDashboardBlocks', () => {
  const full = [
    'pipeline',
    'trend',
    'statusDist',
    'recentFailed',
    'serviceStatus',
    'recentDeployments',
    'topDeployed',
  ];

  it('pairs statusDist + topDeployed at the earlier slot and skips the later one', () => {
    expect(pairDashboardBlocks(full)).toEqual([
      { kind: 'single', id: 'pipeline' },
      { kind: 'single', id: 'trend' },
      { kind: 'pair', left: 'statusDist', right: 'topDeployed' },
      { kind: 'single', id: 'recentFailed' },
      { kind: 'single', id: 'serviceStatus' },
      { kind: 'single', id: 'recentDeployments' },
    ]);
  });

  it('keeps left = the block that appears first in personalized order (topDeployed reordered before statusDist)', () => {
    const reordered = ['topDeployed', 'pipeline', 'statusDist', 'trend'];
    expect(pairDashboardBlocks(reordered)).toEqual([
      { kind: 'pair', left: 'topDeployed', right: 'statusDist' },
      { kind: 'single', id: 'pipeline' },
      { kind: 'single', id: 'trend' },
    ]);
  });

  it('renders every block as single (100% width) when only one of the pair is visible', () => {
    const onlyStatus = ['pipeline', 'statusDist', 'trend'];
    expect(pairDashboardBlocks(onlyStatus)).toEqual([
      { kind: 'single', id: 'pipeline' },
      { kind: 'single', id: 'statusDist' },
      { kind: 'single', id: 'trend' },
    ]);

    const onlyTop = ['pipeline', 'topDeployed', 'trend'];
    expect(pairDashboardBlocks(onlyTop)).toEqual([
      { kind: 'single', id: 'pipeline' },
      { kind: 'single', id: 'topDeployed' },
      { kind: 'single', id: 'trend' },
    ]);
  });

  it('returns all singles when neither pair member is visible', () => {
    expect(pairDashboardBlocks(['pipeline', 'trend'])).toEqual([
      { kind: 'single', id: 'pipeline' },
      { kind: 'single', id: 'trend' },
    ]);
  });

  it('returns an empty array for no visible blocks', () => {
    expect(pairDashboardBlocks([])).toEqual([]);
  });
});

describe('reorder', () => {
  it('moves an item from one position to another', () => {
    expect(reorder(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(reorder(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('returns a copy unchanged for no-op or out-of-range indices', () => {
    expect(reorder(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
    expect(reorder(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
  });
});

const summary = {
  statusStats: [
    { status: 'SUCCESS', count: 7 },
    { status: 'FAILED', count: 2 },
    { status: 'ROLLED_BACK', count: 1 },
    { status: 'RUNNING', count: 1 },
    { status: 'QUEUED', count: 1 },
  ],
  statusStatsByEnvironment: [
    { environment: 'DEV', statusStats: [{ status: 'SUCCESS', count: 3 }] },
    { environment: 'PRODUCTION', statusStats: [{ status: 'FAILED', count: 1 }] },
  ],
  deploymentTrendByStatus: {
    series: ['SUCCESS', 'FAILED', 'RUNNING'],
    points: [
      { date: '2026-06-29', SUCCESS: 0, FAILED: 0, RUNNING: 0 },
      { date: '2026-06-30', SUCCESS: 2, FAILED: 0, RUNNING: 0 },
    ],
  },
} as unknown as DashboardSummaryResponse;

describe('selectStatusStats', () => {
  it('returns the overall stats for ALL', () => {
    expect(selectStatusStats(summary, 'ALL')).toEqual(summary.statusStats);
  });

  it('returns the matching environment stats', () => {
    expect(selectStatusStats(summary, 'DEV')).toEqual([{ status: 'SUCCESS', count: 3 }]);
  });

  it('returns an empty array when the environment is missing', () => {
    expect(selectStatusStats(summary, 'STAGING')).toEqual([]);
  });

  it('orders stats by design_spec.md §6 (SUCCESS→FAILED→ROLLED_BACK→RUNNING→QUEUED), not enum order', () => {
    const enumOrdered = {
      statusStats: [
        { status: 'QUEUED', count: 1 },
        { status: 'RUNNING', count: 1 },
        { status: 'SUCCESS', count: 7 },
        { status: 'FAILED', count: 2 },
        { status: 'ROLLED_BACK', count: 1 },
      ],
    } as unknown as DashboardSummaryResponse;
    expect(selectStatusStats(enumOrdered, 'ALL').map((s) => s.status)).toEqual([
      'SUCCESS',
      'FAILED',
      'ROLLED_BACK',
      'RUNNING',
      'QUEUED',
    ]);
    // 원본 배열은 변형하지 않는다.
    expect(enumOrdered.statusStats[0].status).toBe('QUEUED');
  });
});

describe('selectStatusTrend', () => {
  it('returns the status-bucketed trend (single source)', () => {
    expect(selectStatusTrend(summary)).toBe(summary.deploymentTrendByStatus);
  });
});

describe('statusCount', () => {
  it('finds the count for a status', () => {
    expect(statusCount(summary.statusStats, 'SUCCESS')).toBe(7);
  });

  it('returns 0 for a missing status', () => {
    expect(statusCount([{ status: 'SUCCESS', count: 1 }], 'QUEUED')).toBe(0);
  });
});

describe('inProgressBreakdown', () => {
  it('sums RUNNING + QUEUED from statusStats', () => {
    expect(inProgressBreakdown(summary.statusStats)).toEqual({ running: 1, queued: 1, total: 2 });
  });

  it('treats missing statuses as zero', () => {
    expect(inProgressBreakdown([{ status: 'SUCCESS', count: 5 }])).toEqual({ running: 0, queued: 0, total: 0 });
  });
});

describe('elapsedDaysDisplay', () => {
  it('renders "-" (muted) for null', () => {
    expect(elapsedDaysDisplay(null)).toEqual({ text: '-', warning: false, muted: true });
  });

  it('renders the day count without warning below 14', () => {
    expect(elapsedDaysDisplay(0)).toEqual({ text: '0일', warning: false, muted: false });
    expect(elapsedDaysDisplay(13)).toEqual({ text: '13일', warning: false, muted: false });
  });

  it('flags warning at or above 14 days', () => {
    expect(elapsedDaysDisplay(14)).toEqual({ text: '14일', warning: true, muted: false });
    expect(elapsedDaysDisplay(21)).toEqual({ text: '21일', warning: true, muted: false });
  });

  it('renders "예정" (muted, no warning) when the latest deployment is in the future (negative days)', () => {
    expect(elapsedDaysDisplay(-1)).toEqual({ text: '예정', warning: false, muted: true });
    expect(elapsedDaysDisplay(-30)).toEqual({ text: '예정', warning: false, muted: true });
  });
});

describe('hasTrendData', () => {
  it('returns false when there are no series', () => {
    expect(hasTrendData({ series: [], points: [] })).toBe(false);
  });

  it('returns false when every series value across all points is zero', () => {
    expect(
      hasTrendData({
        series: ['SUCCESS', 'FAILED', 'RUNNING'],
        points: [
          { date: '2026-06-29', SUCCESS: 0, FAILED: 0, RUNNING: 0 },
          { date: '2026-06-30', SUCCESS: 0, FAILED: 0, RUNNING: 0 },
        ],
      }),
    ).toBe(false);
  });

  it('returns true when any series value in any point is greater than zero', () => {
    expect(
      hasTrendData({
        series: ['SUCCESS', 'FAILED', 'RUNNING'],
        points: [
          { date: '2026-06-29', SUCCESS: 0, FAILED: 0, RUNNING: 0 },
          { date: '2026-06-30', SUCCESS: 2, FAILED: 0, RUNNING: 0 },
        ],
      }),
    ).toBe(true);
  });
});

describe('resolveInitialServiceId', () => {
  it('returns null when there are no services', () => {
    expect(resolveInitialServiceId([], 5)).toBeNull();
  });

  it('keeps the stored id when it still exists', () => {
    expect(resolveInitialServiceId([1, 2, 3], 2)).toBe(2);
  });

  it('falls back to the first service when stored id is missing or null', () => {
    expect(resolveInitialServiceId([1, 2, 3], 99)).toBe(1);
    expect(resolveInitialServiceId([4, 5], null)).toBe(4);
  });
});
