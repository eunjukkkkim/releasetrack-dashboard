import type { DeploymentStatus } from '../../api/types';

// 상태 의미색은 프로젝트 팔레트(성공=초록 계열)와 일치시키되, 차트는 면적 채움이라 더 밝고 낮은 채도로 둔다.
// (텍스트 액센트 statusAccentColor 성공 #1f845a 는 대비 위해 진하게 유지 — 채움은 밝게, 텍스트는 진하게.)
// 이전엔 성공=파랑(#1868db)이라 앱 전체(성공=초록)·RUNNING 파랑과 충돌했고, 실패=#de350b 는 채움에 과했다.
const CHART_COLOR = {
  success: '#57b894',
  failed: '#d36e69',
  rolledBack: '#fca700',
  running: '#4c9aff',
  queued: '#b7b9be',
  trendRunning: '#b7b9be',
} as const;

export const statusColors: Record<string, string> = {
  SUCCESS: CHART_COLOR.success,
  FAILED: CHART_COLOR.failed,
  ROLLED_BACK: CHART_COLOR.rolledBack,
  RUNNING: CHART_COLOR.running,
  QUEUED: CHART_COLOR.queued,
};

/** 상태 색이 매핑되지 않은 값의 폴백 색(중립 회색). */
export const FALLBACK_COLOR = '#b7b9be';

/** 상태 문자열에 대응하는 차트 색을 반환한다(미매핑 시 FALLBACK_COLOR). */
export function colorFor(status: string): string {
  return statusColors[status] ?? FALLBACK_COLOR;
}

export const statusLabels: Record<DeploymentStatus, string> = {
  SUCCESS: '성공',
  FAILED: '실패',
  ROLLED_BACK: '롤백',
  RUNNING: '진행 중',
  QUEUED: '대기',
};

export const TREND_BUCKETS = [
  { key: 'SUCCESS', label: '성공', color: CHART_COLOR.success },
  { key: 'FAILED', label: '실패·롤백', color: CHART_COLOR.failed },
  { key: 'RUNNING', label: '진행 중', color: CHART_COLOR.trendRunning },
] as const;

/**
 * Top5 가로 스택 막대의 세그먼트 정의 — 성공 / 실패·롤백 / 진행 중.
 * key 는 TopDeployedServiceResponse 의 카운트 필드명과 1:1 대응(막대 세그먼트를 직접 인덱싱).
 * 색은 TREND_BUCKETS 와 동일 팔레트 재사용(신규 색 없음): 성공 초록·실패 적색·진행중 회색(queued).
 */
export const TOP5_SEGMENTS: {
  key: 'successCount' | 'failedCount' | 'inProgressCount';
  label: string;
  color: string;
}[] = [
  { key: 'successCount', label: '성공', color: CHART_COLOR.success },
  { key: 'failedCount', label: '실패·롤백', color: CHART_COLOR.failed },
  { key: 'inProgressCount', label: '진행 중', color: CHART_COLOR.queued },
];

export function statusAccentColor(status: DeploymentStatus | null): string {
  switch (status) {
    case 'SUCCESS':
      return '#1f845a';
    case 'FAILED':
      return '#de350b';
    case 'ROLLED_BACK':
      return '#fca700';
    case 'RUNNING':
      return '#1868db';
    case 'QUEUED':
      return '#6b778c';
    default:
      return '';
  }
}

export function topDeployBarWidth(count: number, maxCount: number): number {
  if (maxCount <= 0) {
    return 0;
  }
  const percent = (count / maxCount) * 100;
  return Math.max(0, Math.min(100, percent));
}
