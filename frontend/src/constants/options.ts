import type {
  ChangeType,
  DeploymentEnvironment,
  DeploymentStatus,
  ServiceStatus,
} from "../api/types";

export const DEPLOYMENT_ENVIRONMENT_OPTIONS: Array<{
  value: DeploymentEnvironment;
  label: string;
}> = [
  { value: "DEV", label: "DEV" },
  { value: "STAGING", label: "STAGING" },
  { value: "PRODUCTION", label: "PRODUCTION" },
];

export const DEPLOYMENT_STATUS_OPTIONS: Array<{
  value: DeploymentStatus;
  label: string;
}> = [
  { value: "QUEUED", label: "QUEUED" },
  { value: "RUNNING", label: "RUNNING" },
  { value: "SUCCESS", label: "SUCCESS" },
  { value: "FAILED", label: "FAILED" },
  { value: "ROLLED_BACK", label: "ROLLED_BACK" },
];

export const SERVICE_STATUS_OPTIONS: Array<{
  value: ServiceStatus;
  label: string;
}> = [
  { value: "ACTIVE", label: "ACTIVE" },
  { value: "ARCHIVED", label: "ARCHIVED" },
  { value: "MAINTENANCE", label: "MAINTENANCE" },
];

export const CHANGE_TYPE_OPTIONS: ChangeType[] = [
  "FEATURE",
  "BUG_FIX",
  "REFACTOR",
  "CONFIG",
  "ETC",
];
