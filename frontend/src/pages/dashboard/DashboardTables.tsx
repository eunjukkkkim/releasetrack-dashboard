import { Fragment } from "react";
import { Link } from "react-router-dom";
import type {
  DeploymentStatus,
  RecentDeploymentResponse,
  RecentFailedDeploymentResponse,
  ServiceDeploymentStatusResponse,
  ServicePipelineStageResponse,
  TopDeployedServiceResponse,
} from "../../api/types";
import {
  DeploymentStatusTag,
  EnvironmentTag,
  ServiceStatusTag,
} from "../../components/StatusTag";
import { formatDateTime } from "../../components/format";
import { EmptyState } from "../../components/ui/state";
import { cn } from "../../lib/utils";
import { elapsedDaysDisplay } from "./dashboardBlocks";
import {
  TOP5_SEGMENTS,
  statusAccentColor,
  statusLabels,
} from "./dashboardVisuals";

export function FailedDeploymentTable({
  rows,
  onOpen,
}: {
  rows: RecentFailedDeploymentResponse[];
  onOpen: (id: number) => void;
}) {
  if (rows.length === 0) {
    return <EmptyState description="최근 실패한 배포가 없습니다." />;
  }
  return (
    <div className="rt-table-wrap">
      <table className="rt-table">
        <thead>
          <tr>
            <th>서비스명</th>
            <th>버전</th>
            <th>환경</th>
            <th>상태</th>
            <th>배포자</th>
            <th>배포일시</th>
            <th>실패 사유</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onOpen(row.id)}>
              <td>
                <Link to={`/deployments/${row.id}`}>{row.serviceName}</Link>
              </td>
              <td className="rt-cell-mono">{row.version}</td>
              <td>
                <EnvironmentTag environment={row.environment} />
              </td>
              <td>
                <DeploymentStatusTag status={row.status} />
              </td>
              <td>{row.deployedBy}</td>
              <td className="rt-cell-mono">{formatDateTime(row.deployedAt)}</td>
              <td className="rt-truncate">{row.failureReason ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TopDeployedServiceChart({
  rows,
}: {
  rows: TopDeployedServiceResponse[];
}) {
  if (rows.length === 0) {
    return <EmptyState description="배포 이력이 있는 서비스가 없습니다." />;
  }
  const maxCount = Math.max(...rows.map((row) => row.deploymentCount), 0);
  return (
    <div className="rt-bar-chart">
      <ul className="rt-chart-legend rt-chart-legend--top">
        {TOP5_SEGMENTS.map((segment) => (
          <li key={segment.key}>
            <span
              className="rt-legend-chip"
              style={{ background: segment.color }}
            />
            <span style={{ color: segment.color }}>{segment.label}</span>
          </li>
        ))}
      </ul>
      <ol className="rt-bar-list">
        {rows.map((row, index) => {
          const total = row.deploymentCount;
          const segmentSummary = TOP5_SEGMENTS.map(
            (segment) => `${segment.label} ${row[segment.key] ?? 0}`,
          ).join(" · ");
          return (
            <li key={row.serviceId} className="rt-bar-row">
              <span className="rt-bar-rank">{index + 1}</span>
              <Link className="rt-bar-name" to={`/services/${row.serviceId}`}>
                {row.serviceName}
              </Link>
              <div
                className="rt-bar-track"
                role="img"
                aria-label={`${row.serviceName} 배포 ${total}회 (${segmentSummary})`}
                title={`배포 ${total}회 · ${segmentSummary}`}
              >
                <div className="rt-bar-fill-stack">
                  {TOP5_SEGMENTS.map((segment) => {
                    const value = row[segment.key] ?? 0;
                    if (value <= 0) {
                      return null;
                    }
                    return (
                      <span
                        key={segment.key}
                        className="rt-bar-seg"
                        style={{ flexGrow: value, background: segment.color }}
                        title={`${segment.label} ${value}회`}
                      />
                    );
                  })}
                  {maxCount - total > 0 && (
                    <span
                      className="rt-bar-seg rt-bar-seg-empty"
                      style={{ flexGrow: maxCount - total }}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span className="rt-bar-count">{total}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ServiceStatusTable({
  rows,
}: {
  rows: ServiceDeploymentStatusResponse[];
}) {
  if (rows.length === 0) {
    return <EmptyState description="서비스 상태 데이터가 없습니다." />;
  }
  return (
    <div className="rt-table-wrap">
      <table className="rt-table">
        <thead>
          <tr>
            <th>서비스명</th>
            <th>담당자</th>
            <th>서비스 상태</th>
            <th>마지막 버전</th>
            <th>마지막 환경</th>
            <th>마지막 상태</th>
            <th>마지막 배포일</th>
            <th className="rt-cell-num">경과일</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const elapsed = elapsedDaysDisplay(row.daysSinceLastDeployment);
            return (
              <tr key={row.serviceId}>
                <td>
                  <Link to={`/services/${row.serviceId}`}>
                    {row.serviceName}
                  </Link>
                </td>
                <td>{row.owner ?? "-"}</td>
                <td>
                  <ServiceStatusTag status={row.serviceStatus} />
                </td>
                <td className="rt-cell-mono">
                  {row.lastDeploymentVersion ?? "-"}
                </td>
                <td>
                  {row.lastDeploymentEnvironment ? (
                    <EnvironmentTag
                      environment={row.lastDeploymentEnvironment}
                    />
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {row.lastDeploymentStatus ? (
                    <DeploymentStatusTag status={row.lastDeploymentStatus} />
                  ) : (
                    "-"
                  )}
                </td>
                <td className="rt-cell-mono">
                  {formatDateTime(row.lastDeployedAt)}
                </td>
                <td
                  className={cn(
                    "rt-cell-num",
                    elapsed.warning && "rt-elapsed-warn",
                    elapsed.muted && "rt-elapsed-none",
                  )}
                >
                  {elapsed.warning ? `⚠ ${elapsed.text}` : elapsed.text}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function RecentDeploymentTable({
  rows,
  onOpen,
}: {
  rows: RecentDeploymentResponse[];
  onOpen: (id: number) => void;
}) {
  if (rows.length === 0) {
    return <EmptyState description="최근 배포 이력이 없습니다." />;
  }
  return (
    <div className="rt-table-wrap">
      <table className="rt-table">
        <thead>
          <tr>
            <th>서비스명</th>
            <th>버전</th>
            <th>환경</th>
            <th>상태</th>
            <th>배포자</th>
            <th>배포일시</th>
            <th>요약</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} onClick={() => onOpen(row.id)}>
              <td>
                <Link to={`/deployments/${row.id}`}>{row.serviceName}</Link>
              </td>
              <td className="rt-cell-mono">{row.version}</td>
              <td>
                <EnvironmentTag environment={row.environment} />
              </td>
              <td>
                <DeploymentStatusTag status={row.status} />
              </td>
              <td>{row.deployedBy}</td>
              <td className="rt-cell-mono">{formatDateTime(row.deployedAt)}</td>
              <td className="rt-truncate">{row.summary ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EnvironmentPipeline({
  rows,
  onOpen,
}: {
  rows: ServicePipelineStageResponse[];
  onOpen: (id: number) => void;
}) {
  if (rows.length === 0) {
    return <EmptyState description="환경 파이프라인 데이터가 없습니다." />;
  }
  return (
    <div className="env-pipeline">
      {rows.map((row, index) => {
        const hasDeployment = row.deploymentId != null;
        return (
          <Fragment key={row.environment}>
            <div
              className={`env-pipeline-card${hasDeployment ? "" : " env-pipeline-card-empty"}`}
              onClick={
                hasDeployment
                  ? () => onOpen(row.deploymentId as number)
                  : undefined
              }
              role={hasDeployment ? "button" : undefined}
            >
              <div className="env-pipeline-head">
                <EnvironmentTag environment={row.environment} />
              </div>
              {hasDeployment ? (
                <div className="env-pipeline-body">
                  <div className="env-pipeline-version">
                    {row.version ?? "-"}
                  </div>
                  <dl className="env-pipeline-meta">
                    <div>
                      <dt>서비스</dt>
                      <dd>{row.serviceName ?? "-"}</dd>
                    </div>
                    <div>
                      <dt>브랜치</dt>
                      <dd>{row.branch ?? "-"}</dd>
                    </div>
                    <div>
                      <dt>배포 상태</dt>
                      <dd>
                        <strong
                          style={{
                            color: statusAccentColor(row.status) || undefined,
                          }}
                        >
                          {statusLabels[row.status as DeploymentStatus] ?? "-"}
                        </strong>
                      </dd>
                    </div>
                    <div>
                      <dt>배포자</dt>
                      <dd>{row.deployedBy ?? "-"}</dd>
                    </div>
                    <div>
                      <dt>배포일시</dt>
                      <dd>{formatDateTime(row.deployedAt)}</dd>
                    </div>
                    <div>
                      <dt>종료시각</dt>
                      <dd>{formatDateTime(row.finishedAt)}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="env-pipeline-empty">배포 없음</div>
              )}
            </div>
            {index < rows.length - 1 ? (
              <div className="env-pipeline-arrow" aria-hidden="true">
                →
              </div>
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
