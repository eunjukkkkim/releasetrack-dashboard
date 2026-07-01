import type { ReactNode } from "react";
import type { DashboardSummaryResponse } from "../../api/types";
import { cn } from "../../lib/utils";
import { inProgressBreakdown } from "./dashboardBlocks";

function KpiCard({
  label,
  helper,
  children,
  valueColor,
  dark = false,
  dangerBorder = false,
}: {
  label: string;
  helper: string;
  children: ReactNode;
  valueColor?: string;
  dark?: boolean;
  dangerBorder?: boolean;
}) {
  return (
    <div
      className={cn(
        "rt-kpi",
        dark && "rt-kpi-dark",
        dangerBorder && "rt-kpi-danger",
      )}
    >
      <div className="rt-kpi-label">{label}</div>
      <div
        className="rt-kpi-value"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {children}
      </div>
      <div className="rt-kpi-helper">{helper}</div>
    </div>
  );
}

export function KpiRow({ summary }: { summary: DashboardSummaryResponse }) {
  const inProgress = inProgressBreakdown(summary.statusStats);
  const failedRollback = summary.failedDeploymentCount + summary.rollbackCount;
  return (
    <section className="kpi-grid">
      <KpiCard
        label="활성 서비스"
        helper={`ACTIVE · 전체 ${summary.totalServiceCount}개 중`}
      >
        {summary.activeServiceCount}
        <span className="rt-kpi-sub">/ {summary.totalServiceCount}</span>
      </KpiCard>
      <KpiCard
        label="최근 7일 배포"
        helper={`Production ${summary.productionDeploymentCount}건 포함`}
      >
        {summary.weeklyDeploymentCount}
      </KpiCard>
      <KpiCard
        label="진행 중 배포"
        helper={`RUNNING ${inProgress.running} · QUEUED ${inProgress.queued}`}
        valueColor="#1868db"
      >
        {inProgress.total}
      </KpiCard>
      <KpiCard
        label="실패 · 롤백"
        helper={`실패 ${summary.failedDeploymentCount} · 롤백 ${summary.rollbackCount}`}
        valueColor="#de350b"
        dangerBorder
      >
        {failedRollback}
      </KpiCard>
      <KpiCard label="배포 성공률" helper="최근 7일 기준" valueColor="#1f845a">
        {summary.successRate}%
      </KpiCard>
    </section>
  );
}
