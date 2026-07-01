import type {
  DashboardSummaryResponse,
  DeploymentEnvironment,
  DeploymentSeriesTrendResponse,
  DeploymentStatus,
  StatusStatResponse,
} from '../../api/types';

/**
 * 대시보드 카드(블록) 메타데이터. 표시명·기본 표시여부·기본 정렬 가중치의 단일 소스.
 * 새 블록을 추가하려면 이 레지스트리에만 항목을 넣으면 저장 레이아웃과 자동 머지된다.
 */
export interface DashboardBlock {
  id: string;
  label: string;
  defaultVisible: boolean;
  defaultOrder: number;
}

/** 저장되는 레이아웃 형태 (localStorage `rt.dashboard.layout`). */
export interface DashboardLayout {
  order: string[];
  hidden: string[];
}

export const DASHBOARD_LAYOUT_STORAGE_KEY = 'rt.dashboard.layout';
export const PIPELINE_SERVICE_STORAGE_KEY = 'rt.dashboard.pipeline.serviceId';

/**
 * 블록 레지스트리 (단일 소스). 기본 순서(디자인 정렬): 파이프라인 → 추이 → 상태분포 → 최근실패 →
 * 서비스별 마지막상태 → 최근이력. Top5(topDeployed)는 디자인에 없어 기본 숨김(개인화로 선택 가능).
 * 장기 미배포(stale) 블럭은 serviceStatus 표의 '경과일' 컬럼으로 병합되어 제거됨.
 */
export const DASHBOARD_BLOCKS: DashboardBlock[] = [
  { id: 'pipeline', label: '환경 파이프라인 현황', defaultVisible: true, defaultOrder: 1 },
  { id: 'trend', label: '최근 7일 배포 추이', defaultVisible: true, defaultOrder: 2 },
  { id: 'statusDist', label: '상태별 배포 분포', defaultVisible: true, defaultOrder: 3 },
  { id: 'recentFailed', label: '최근 실패 배포', defaultVisible: true, defaultOrder: 4 },
  { id: 'serviceStatus', label: '서비스별 마지막 배포 상태', defaultVisible: true, defaultOrder: 5 },
  { id: 'recentDeployments', label: '최근 배포 이력', defaultVisible: true, defaultOrder: 6 },
  { id: 'topDeployed', label: '서비스별 배포 현황 Top 5', defaultVisible: false, defaultOrder: 7 },
];

/**
 * 저장 레이아웃을 레지스트리와 머지한다 (순수 함수).
 * - 저장된 order 중 레지스트리에 없는(삭제된) id 는 무시한다.
 * - 레지스트리에 있으나 저장 order 에 없는(신규) id 는 defaultOrder 순으로 뒤에 자동 편입한다.
 * - hidden 도 레지스트리에 존재하는 id 로만 정규화하고, 신규 블록은 defaultVisible=false 이면 숨김으로 편입한다.
 */
export function mergeLayout(blocks: DashboardBlock[], stored: Partial<DashboardLayout> | null): DashboardLayout {
  const known = new Set(blocks.map((b) => b.id));
  const storedOrder = Array.isArray(stored?.order) ? stored!.order : [];
  const storedHidden = Array.isArray(stored?.hidden) ? stored!.hidden : [];

  const order: string[] = [];
  const seen = new Set<string>();
  for (const id of storedOrder) {
    if (known.has(id) && !seen.has(id)) {
      order.push(id);
      seen.add(id);
    }
  }
  const newBlocks = blocks.filter((b) => !seen.has(b.id)).sort((a, b) => a.defaultOrder - b.defaultOrder);
  for (const b of newBlocks) {
    order.push(b.id);
  }

  const hidden: string[] = [];
  const hiddenSet = new Set<string>();
  for (const id of storedHidden) {
    if (known.has(id) && !hiddenSet.has(id)) {
      hidden.push(id);
      hiddenSet.add(id);
    }
  }
  for (const b of newBlocks) {
    if (!b.defaultVisible && !hiddenSet.has(b.id)) {
      hidden.push(b.id);
      hiddenSet.add(b.id);
    }
  }

  return { order, hidden };
}

/** effectiveOrder 정렬 후 hidden 을 제외한 렌더 대상 블록 id 목록 (순수 함수). */
export function visibleBlockIds(layout: DashboardLayout): string[] {
  const hidden = new Set(layout.hidden);
  return layout.order.filter((id) => !hidden.has(id));
}

/** 렌더 아이템 — 단독 블럭 또는 좌우 2열로 묶인 페어. */
export type BlockRenderItem =
  | { kind: 'single'; id: string }
  | { kind: 'pair'; left: string; right: string };

/** 한 행 2열로 묶는 페어 대상(둘 다 visible 일 때만 페어링). */
const PAIRED_BLOCK_IDS = ['statusDist', 'topDeployed'] as const;

/**
 * visibleBlockIds 결과를 렌더 아이템 배열로 변환한다 (순수 함수, 표시 계층 전용).
 * - statusDist 와 topDeployed 가 **둘 다** visible 이면 한 페어로 묶는다. 아니면 전부 single.
 * - 페어는 둘 중 **순서상 먼저 나오는** id 위치에 emit 하고(left=먼저, right=나중), 나중 id 는 순회 중 skip.
 *   → 나머지 블럭의 개인화 순서·상대위치는 완전 보존된다.
 * - left = 개인화 순서상 앞선 블럭(사용자 정렬 의도 보존).
 */
export function pairDashboardBlocks(visibleIds: string[]): BlockRenderItem[] {
  const pairSet = new Set<string>(PAIRED_BLOCK_IDS);
  const bothVisible = PAIRED_BLOCK_IDS.every((id) => visibleIds.includes(id));

  if (!bothVisible) {
    return visibleIds.map((id) => ({ kind: 'single', id }));
  }

  const [first, second] = visibleIds.filter((id) => pairSet.has(id));
  const items: BlockRenderItem[] = [];
  for (const id of visibleIds) {
    if (id === first) {
      items.push({ kind: 'pair', left: first, right: second });
    } else if (id === second) {
      // 페어는 first 자리에서 이미 emit — 나중 id 는 건너뛴다.
      continue;
    } else {
      items.push({ kind: 'single', id });
    }
  }
  return items;
}

/** order 배열에서 from 위치 항목을 to 위치로 이동한 새 배열을 반환한다 (드래그 재배열용, 순수 함수). */
export function reorder(order: string[], from: number, to: number): string[] {
  if (from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) {
    return order.slice();
  }
  const next = order.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export type StatusDistScope = 'ALL' | DeploymentEnvironment;

/**
 * 도넛 슬라이스/범례 표시 순서 — design_spec.md §6 (성공 우선).
 * 백엔드 statusStats 는 enum 선언 순(QUEUED 먼저)이라 표시 직전 이 순서로 정렬한다.
 */
export const STATUS_DISPLAY_ORDER: DeploymentStatus[] = ['SUCCESS', 'FAILED', 'ROLLED_BACK', 'RUNNING', 'QUEUED'];

/** statusStats 를 스펙 표시 순서로 정렬한 새 배열을 반환한다 (원본 불변, 순수 함수). */
function sortByDisplayOrder(stats: StatusStatResponse[]): StatusStatResponse[] {
  return [...stats].sort(
    (a, b) => STATUS_DISPLAY_ORDER.indexOf(a.status) - STATUS_DISPLAY_ORDER.indexOf(b.status),
  );
}

/**
 * 상태 분포 셀렉터의 데이터 소스를 선택한다 (순수 함수).
 * 'ALL' 이면 전체 statusStats, 환경 선택 시 statusStatsByEnvironment 에서 해당 환경의 분포.
 * 해당 환경 항목이 없으면 빈 배열. 반환은 항상 design_spec.md §6 표시 순서로 정렬된다.
 */
export function selectStatusStats(summary: DashboardSummaryResponse, scope: StatusDistScope): StatusStatResponse[] {
  const stats =
    scope === 'ALL'
      ? summary.statusStats
      : summary.statusStatsByEnvironment.find((e) => e.environment === scope)?.statusStats ?? [];
  return sortByDisplayOrder(stats);
}

/**
 * 상태별 누적 막대 추이의 데이터 소스를 선택한다 (순수 함수).
 * 멀티라인(서비스별/환경별) 토글이 폐기되어 단일 소스(deploymentTrendByStatus)로 단순화됨.
 */
export function selectStatusTrend(summary: DashboardSummaryResponse): DeploymentSeriesTrendResponse {
  return summary.deploymentTrendByStatus;
}

/** statusStats 배열에서 특정 상태의 카운트를 찾는다 (없으면 0, 순수 함수). */
export function statusCount(stats: StatusStatResponse[], status: DeploymentStatus): number {
  return stats.find((s) => s.status === status)?.count ?? 0;
}

/**
 * 진행 중 배포 KPI 파생 (순수 함수).
 * top-level 필드가 없어 statusStats(7일 윈도우 5상태 0채움)에서 RUNNING + QUEUED 를 합산한다.
 */
export interface InProgressBreakdown {
  running: number;
  queued: number;
  total: number;
}

export function inProgressBreakdown(statusStats: StatusStatResponse[]): InProgressBreakdown {
  const running = statusCount(statusStats, 'RUNNING');
  const queued = statusCount(statusStats, 'QUEUED');
  return { running, queued, total: running + queued };
}

/**
 * 서비스별 마지막 배포 상태 표의 '경과일' 표기를 계산한다 (순수 함수).
 * null(이력 없음) → "-"(muted), >=14일 → 경고(warning) + 일수, 그 외 → 일수.
 */
export interface ElapsedDaysDisplay {
  text: string;
  warning: boolean;
  muted: boolean;
}

export function elapsedDaysDisplay(days: number | null): ElapsedDaysDisplay {
  if (days == null) {
    return { text: '-', warning: false, muted: true };
  }
  // 미래 일시 배포가 그 서비스의 최신이면 경과일이 음수가 될 수 있다 → "예정"(muted, 경고 아님).
  if (days < 0) {
    return { text: '예정', warning: false, muted: true };
  }
  return { text: `${days}일`, warning: days >= 14, muted: false };
}

/**
 * 추이에 실제 표시할 데이터가 있는지 판정한다 (순수 함수).
 * series 가 항상 3(0채움)이라 series 길이로는 빈 상태를 가릴 수 없으므로,
 * 모든 point 의 모든 series 값이 0이면 데이터 없음으로 본다(상태분포 hasData 검사와 일관).
 * series 가 비었거나 point 가 전부 0이면 false.
 */
export function hasTrendData(trend: DeploymentSeriesTrendResponse): boolean {
  if (trend.series.length === 0) {
    return false;
  }
  return trend.points.some((point) =>
    trend.series.some((name) => {
      const value = point[name];
      return typeof value === 'number' && value > 0;
    }),
  );
}

/**
 * 파이프라인 카드의 초기 선택 서비스 id 를 결정한다 (순수 함수).
 * 저장값이 현재 서비스 목록에 존재하면 그 값을, 없으면 첫 서비스를 쓴다. 목록이 비면 null.
 */
export function resolveInitialServiceId(serviceIds: number[], storedId: number | null): number | null {
  if (serviceIds.length === 0) {
    return null;
  }
  if (storedId != null && serviceIds.includes(storedId)) {
    return storedId;
  }
  return serviceIds[0];
}
