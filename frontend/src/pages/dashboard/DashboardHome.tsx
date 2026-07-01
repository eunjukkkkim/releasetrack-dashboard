import { Fragment, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { ErrorBox, LoadingBox } from "../../components/StateBox";
import { Button } from "../../components/ui/button";
import { Alert } from "../../components/ui/state";
import { useDashboardSummary } from "../../hooks/useDashboardSummary";
import { DashboardSettings } from "./DashboardSettings";
import { KpiRow } from "./DashboardKpi";
import { DashboardBlock } from "./DashboardBlock";
import { PipelineCard } from "./PipelineCard";
import { StatusDistCard, TrendCard } from "./DashboardCharts";
import {
  FailedDeploymentTable,
  RecentDeploymentTable,
  ServiceStatusTable,
  TopDeployedServiceChart,
} from "./DashboardTables";
import {
  DASHBOARD_BLOCKS,
  DASHBOARD_LAYOUT_STORAGE_KEY,
  mergeLayout,
  pairDashboardBlocks,
  visibleBlockIds,
  type DashboardLayout,
} from "./dashboardBlocks";
import { safeStorage } from "../../lib/storage";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";

export { TopDeployedServiceChart } from "./DashboardTables";
export { statusAccentColor, topDeployBarWidth } from "./dashboardVisuals";

function readStoredLayout(): Partial<DashboardLayout> | null {
  const raw = safeStorage.get(DASHBOARD_LAYOUT_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as Partial<DashboardLayout>;
  } catch {
    return null;
  }
}

function writeStoredLayout(layout: DashboardLayout) {
  safeStorage.set(DASHBOARD_LAYOUT_STORAGE_KEY, JSON.stringify(layout));
}

const OPS_ALERT_DISMISS_KEY = "rt.opsAlertDismissed";

export function DashboardHome() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useDashboardSummary();
  const [layout, setLayout] = useState<DashboardLayout>(() =>
    mergeLayout(DASHBOARD_BLOCKS, readStoredLayout()),
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dismissedOps, setDismissedOps] =
    useLocalStorageState(OPS_ALERT_DISMISS_KEY);

  useEffect(() => {
    writeStoredLayout(layout);
  }, [layout]);

  if (isLoading) {
    return <LoadingBox />;
  }
  if (isError || !data) {
    return <ErrorBox error={error} />;
  }

  const open = (id: number) => navigate(`/deployments/${id}`);

  const opsSignature = `${data.failedDeploymentCount}-${data.rollbackCount}`;
  const showOpsAlert =
    (data.failedDeploymentCount > 0 || data.rollbackCount > 0) &&
    dismissedOps !== opsSignature;
  const dismissOps = () => setDismissedOps(opsSignature);

  const blocks: Record<string, () => ReactNode> = {
    pipeline: () => <PipelineCard onOpen={open} />,
    trend: () => <TrendCard summary={data} />,
    statusDist: () => <StatusDistCard summary={data} />,
    recentFailed: () => (
      <DashboardBlock title="최근 실패 배포">
        <FailedDeploymentTable
          rows={data.recentFailedDeployments}
          onOpen={open}
        />
      </DashboardBlock>
    ),
    serviceStatus: () => (
      <DashboardBlock title="서비스별 최근 배포 상태">
        <ServiceStatusTable rows={data.serviceDeploymentStatuses} />
      </DashboardBlock>
    ),
    recentDeployments: () => (
      <DashboardBlock title="최근 배포 이력">
        <RecentDeploymentTable rows={data.recentDeployments} onOpen={open} />
      </DashboardBlock>
    ),
    topDeployed: () => (
      <DashboardBlock title="서비스별 배포 횟수 Top 5" className="chart-card">
        <TopDeployedServiceChart rows={data.topDeployedServices} />
      </DashboardBlock>
    ),
  };

  const renderBlock = (id: string) => {
    const render = blocks[id];
    return render ? <Fragment key={id}>{render()}</Fragment> : null;
  };

  return (
    <div className="page-stack dashboard-page">
      <section className="dashboard-hero">
        <div>
          <h1>ReleaseTrack Dashboard</h1>
          <p>서비스 배포 현황과 변경사항을 한눈에 확인합니다.</p>
        </div>
        <div className="dashboard-hero-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setSettingsOpen(true)}
            aria-label="대시보드 블록 설정"
            title="대시보드 블록 설정"
          >
            <Settings size={16} aria-hidden="true" />
          </Button>
        </div>
      </section>

      {showOpsAlert && (
        <Alert
          variant="warning"
          title="운영 주의 항목이 있습니다."
          description={`최근 7일 기준 실패 배포 ${data.failedDeploymentCount}건, 롤백 ${data.rollbackCount}건이 확인되었습니다.`}
          onClose={dismissOps}
        />
      )}

      <KpiRow summary={data} />

      {pairDashboardBlocks(visibleBlockIds(layout)).map((item) =>
        item.kind === "pair" ? (
          <div
            className="dashboard-row-2"
            key={`pair-${item.left}-${item.right}`}
          >
            {renderBlock(item.left)}
            {renderBlock(item.right)}
          </div>
        ) : (
          renderBlock(item.id)
        ),
      )}

      {settingsOpen && (
        <DashboardSettings
          layout={layout}
          onChange={setLayout}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
