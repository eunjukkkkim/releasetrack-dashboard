export type ServiceStatus = 'ACTIVE' | 'ARCHIVED' | 'MAINTENANCE';
export type DeploymentEnvironment = 'DEV' | 'STAGING' | 'PRODUCTION';
export type DeploymentStatus = 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
export type ChangeType = 'FEATURE' | 'BUG_FIX' | 'REFACTOR' | 'CONFIG' | 'ETC';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ServiceResponse {
  id: number;
  name: string;
  description: string | null;
  owner: string | null;
  repositoryUrl: string | null;
  status: ServiceStatus;
  lastDeploymentVersion: string | null;
  lastDeployedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCreateRequest {
  name: string;
  description?: string;
  owner?: string;
  repositoryUrl?: string;
  status: ServiceStatus;
}

// 수정 요청은 name/owner를 받지 않는다(읽기전용). Create 파생을 끊어 name/owner 유입을 차단.
export type ServiceUpdateRequest = Partial<
  Pick<ServiceCreateRequest, 'description' | 'repositoryUrl' | 'status'>
>;

export interface DeploymentChangeRequest {
  changeType: ChangeType;
  description: string;
}

export interface DeploymentChangeResponse {
  id: number;
  changeType: ChangeType;
  description: string;
}

export interface DeploymentListResponse {
  id: number;
  serviceId: number;
  serviceName: string;
  version: string;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  deployedBy: string;
  deployedAt: string;
  summary: string | null;
  rollbacked: boolean;
  branch: string | null;
}

export interface DeploymentResponse extends DeploymentListResponse {
  failureReason: string | null;
  commit: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationSec: number | null;
  changes: DeploymentChangeResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentCreateRequest {
  serviceId: number;
  version: string;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  deployedBy: string;
  deployedAt: string;
  summary?: string;
  failureReason?: string | null;
  rollbacked?: boolean;
  commit?: string | null;
  branch?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  changes?: DeploymentChangeRequest[];
}

export interface DeploymentUpdateRequest {
  environment?: DeploymentEnvironment;
  status?: DeploymentStatus;
  summary?: string;
  failureReason?: string | null;
  rollbacked?: boolean;
  commit?: string | null;
  branch?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface ServiceSearchParams {
  status?: ServiceStatus;
  keyword?: string;
}

export interface DeploymentSearchParams {
  serviceId?: number;
  environment?: DeploymentEnvironment;
  status?: DeploymentStatus;
  branch?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface RecentDeploymentResponse {
  id: number;
  serviceName: string;
  version: string;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  deployedBy: string;
  deployedAt: string;
  summary: string | null;
}

export interface DeploymentTrendPoint {
  date: string; // yyyy-MM-dd
  [series: string]: string | number; // series 값은 number(0채움), date 만 string
}

export interface DeploymentSeriesTrendResponse {
  series: string[]; // 항상 ["SUCCESS","FAILED","RUNNING"] 3 고정(상태 버킷, 영문 enum 안정키)
  points: DeploymentTrendPoint[]; // 길이 7, 모든 series 키를 0채움으로 포함
}

export interface StatusStatResponse {
  status: DeploymentStatus;
  count: number;
}

/**
 * 환경별 상태 분포. statusStatsByEnvironment 의 각 항목.
 * environment 는 비-null, statusStats 는 길이 5(QUEUED/RUNNING/SUCCESS/FAILED/ROLLED_BACK, 0채움).
 */
export interface EnvironmentStatusStatsResponse {
  environment: DeploymentEnvironment;
  statusStats: StatusStatResponse[];
}

export interface RecentFailedDeploymentResponse {
  id: number;
  serviceName: string;
  version: string;
  environment: DeploymentEnvironment;
  status: DeploymentStatus;
  deployedBy: string;
  deployedAt: string;
  failureReason: string | null;
  rollbacked: boolean;
}

export interface TopDeployedServiceResponse {
  serviceId: number;
  serviceName: string;
  /** 전체 배포수(전기간). 불변식: deploymentCount == successCount + failedCount + inProgressCount. */
  deploymentCount: number;
  /** status == SUCCESS. */
  successCount: number;
  /** status IN (FAILED, ROLLED_BACK) 합산. */
  failedCount: number;
  /** status IN (RUNNING, QUEUED) 합산. */
  inProgressCount: number;
}

export interface ServiceDeploymentStatusResponse {
  serviceId: number;
  serviceName: string;
  serviceStatus: ServiceStatus;
  owner: string | null;
  lastDeploymentVersion: string | null;
  lastDeploymentEnvironment: DeploymentEnvironment | null;
  lastDeploymentStatus: DeploymentStatus | null;
  lastDeployedAt: string | null;
  /** lastDeployedAt.toLocalDate()부터 today까지 경과 일수. lastDeployedAt==null ⟺ null. */
  daysSinceLastDeployment: number | null;
}

/**
 * GET /api/dashboard/pipeline?serviceId= 의 단일 환경 stage.
 * 응답 배열은 항상 길이 3(DEV/STAGING/PRODUCTION 고정 순서).
 * 해당 환경에 배포가 없으면 environment 외 전 필드 null.
 */
export interface ServicePipelineStageResponse {
  environment: DeploymentEnvironment;
  deploymentId: number | null;
  serviceName: string | null;
  version: string | null;
  status: DeploymentStatus | null;
  branch: string | null;
  deployedBy: string | null;
  deployedAt: string | null;
  finishedAt: string | null;
}

export interface DashboardSummaryResponse {
  totalServiceCount: number;
  activeServiceCount: number;
  weeklyDeploymentCount: number;
  productionDeploymentCount: number;
  successDeploymentCount: number;
  failedDeploymentCount: number;
  rollbackCount: number;
  successRate: number;
  /**
   * 상태별 누적 막대용. series 는 항상 ["SUCCESS","FAILED","RUNNING"](3 고정, 영문 enum 안정키),
   * points 는 길이 7(today-6~today). 버킷: SUCCESS=SUCCESS, FAILED=FAILED+ROLLED_BACK, RUNNING=RUNNING+QUEUED.
   */
  deploymentTrendByStatus: DeploymentSeriesTrendResponse;
  statusStats: StatusStatResponse[];
  statusStatsByEnvironment: EnvironmentStatusStatsResponse[];
  recentFailedDeployments: RecentFailedDeploymentResponse[];
  serviceDeploymentStatuses: ServiceDeploymentStatusResponse[];
  recentDeployments: RecentDeploymentResponse[];
  topDeployedServices: TopDeployedServiceResponse[];
}

export interface ErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  fieldErrors: Array<{ field: string; message: string }>;
}
