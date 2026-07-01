import type {
  DeploymentEnvironment,
  DeploymentStatus,
  ServiceStatus,
} from "../api/types";
import { Badge } from "./ui/badge";

const serviceStatusVariant: Record<
  ServiceStatus,
  "success" | "maintenance" | "inactive"
> = {
  ACTIVE: "success",
  MAINTENANCE: "maintenance",
  ARCHIVED: "inactive",
};

// 표시 라벨 전용. ACTIVE/MAINTENANCE/ARCHIVED 모두 와이어 enum 과 동일한 영문 라벨로 통일한다.
const serviceStatusLabel: Record<ServiceStatus, string> = {
  ACTIVE: "ACTIVE",
  MAINTENANCE: "MAINTENANCE",
  ARCHIVED: "ARCHIVED",
};

export function ServiceStatusTag({ status }: { status: ServiceStatus }) {
  return (
    <Badge variant={serviceStatusVariant[status] ?? "inactive"}>
      {serviceStatusLabel[status] ?? status}
    </Badge>
  );
}

const deploymentStatusVariant: Record<
  DeploymentStatus,
  "success" | "danger" | "warning" | "info" | "muted"
> = {
  SUCCESS: "success",
  FAILED: "danger",
  ROLLED_BACK: "warning",
  RUNNING: "info",
  QUEUED: "muted",
};

export function DeploymentStatusTag({ status }: { status: DeploymentStatus }) {
  return (
    <Badge variant={deploymentStatusVariant[status] ?? "info"}>{status}</Badge>
  );
}

const environmentVariant: Record<
  DeploymentEnvironment,
  "production" | "staging" | "dev"
> = {
  PRODUCTION: "production",
  STAGING: "staging",
  DEV: "dev",
};

export function EnvironmentTag({
  environment,
}: {
  environment: DeploymentEnvironment;
}) {
  return (
    <Badge variant={environmentVariant[environment] ?? "dev"}>
      {environment}
    </Badge>
  );
}
