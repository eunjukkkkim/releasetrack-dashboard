import type { DeploymentCreateRequest } from '../../api/types';
import { fromLocalDateTimeInputValue, normalizeOptionalText } from '../../components/format';

export interface DeploymentCreateFormValues extends Omit<DeploymentCreateRequest, 'deployedAt'> {
  deployedAt: string;
}

export const DEFAULT_DEPLOYMENT_CREATE_FORM: DeploymentCreateFormValues = {
  serviceId: 0,
  version: '',
  environment: 'PRODUCTION',
  status: 'SUCCESS',
  deployedBy: '',
  deployedAt: '',
  summary: '',
  failureReason: '',
  rollbacked: false,
  commit: '',
  branch: '',
  startedAt: '',
  finishedAt: '',
  changes: [{ changeType: 'FEATURE', description: '' }],
};

export function toDeploymentCreateRequest(form: DeploymentCreateFormValues): DeploymentCreateRequest {
  return {
    ...form,
    serviceId: Number(form.serviceId),
    deployedAt: fromLocalDateTimeInputValue(form.deployedAt),
    rollbacked: Boolean(form.rollbacked),
    summary: normalizeOptionalText(form.summary),
    failureReason: normalizeOptionalText(form.failureReason),
    commit: normalizeOptionalText(form.commit),
    branch: normalizeOptionalText(form.branch),
    startedAt: form.startedAt ? fromLocalDateTimeInputValue(form.startedAt) : undefined,
    finishedAt: form.finishedAt ? fromLocalDateTimeInputValue(form.finishedAt) : undefined,
    changes: form.changes?.filter((change) => change.description.trim()) ?? [],
  };
}
