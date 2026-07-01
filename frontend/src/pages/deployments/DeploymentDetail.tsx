import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage } from "../../api/client";
import type { DeploymentUpdateRequest } from "../../api/types";
import { ConfirmDialog, SuccessDialog } from "../../components/FeedbackDialog";
import { ErrorBox, LoadingBox } from "../../components/StateBox";
import {
  formatDateTime,
  formatDuration,
  fromLocalDateTimeInputValue,
  normalizeOptionalText,
  toLocalDateTimeInputValue,
} from "../../components/format";
import { LinkButton, Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import {
  BranchField,
  CommitField,
  DeploymentStatusField,
  DeploymentTimingFields,
  EnvironmentField,
  FailureReasonField,
  RollbackField,
  SummaryField,
} from "./DeploymentFormFields";
import {
  useDeleteDeployment,
  useDeployment,
  useUpdateDeployment,
} from "../../queries/deploymentQueries";

export function DeploymentDetail({ deploymentId }: { deploymentId: number }) {
  const navigate = useNavigate();
  const deploymentQuery = useDeployment(deploymentId);
  const updateMutation = useUpdateDeployment(deploymentId);
  const deleteMutation = useDeleteDeployment();
  const [successOpen, setSuccessOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [form, setForm] = useState<DeploymentUpdateRequest>({});

  useEffect(() => {
    if (deploymentQuery.data) {
      setForm({
        environment: deploymentQuery.data.environment,
        status: deploymentQuery.data.status,
        summary: deploymentQuery.data.summary ?? "",
        failureReason: deploymentQuery.data.failureReason ?? "",
        branch: deploymentQuery.data.branch ?? "",
        commit: deploymentQuery.data.commit ?? "",
        startedAt: toLocalDateTimeInputValue(deploymentQuery.data.startedAt),
        finishedAt: toLocalDateTimeInputValue(deploymentQuery.data.finishedAt),
        rollbacked: deploymentQuery.data.rollbacked,
      });
    }
  }, [deploymentQuery.data]);

  if (deploymentQuery.isLoading) return <LoadingBox />;
  if (deploymentQuery.isError || !deploymentQuery.data)
    return <ErrorBox error={deploymentQuery.error} />;

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    const isFailedStatus = form.status === "FAILED";
    try {
      // optional 텍스트 필드는 모두 동일 규칙으로 정규화(빈값/공백 → undefined = PATCH 미변경).
      // 시각 입력은 로컬 입력값(yyyy-MM-ddTHH:mm)을 ':00' 부여해 전송(Create 폼과 동일 패턴).
      const payload: DeploymentUpdateRequest = {
        ...form,
        summary: normalizeOptionalText(form.summary),
        failureReason: isFailedStatus
          ? normalizeOptionalText(form.failureReason)
          : undefined,
        branch: normalizeOptionalText(form.branch),
        commit: normalizeOptionalText(form.commit),
        startedAt: form.startedAt
          ? fromLocalDateTimeInputValue(form.startedAt)
          : undefined,
        finishedAt: form.finishedAt
          ? fromLocalDateTimeInputValue(form.finishedAt)
          : undefined,
      };
      await updateMutation.mutateAsync(payload);
      setSuccessOpen(true);
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(deploymentId);
      setDeleteConfirmOpen(false);
      navigate("/deployments");
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  const deployment = deploymentQuery.data;
  const showFailureReason = (form.status ?? deployment.status) === "FAILED";

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>
            {deployment.serviceName} {deployment.version}
          </h1>
          <p>배포 상세 정보와 변경사항을 확인합니다.</p>
        </div>
        <div className="action-row">
          <LinkButton to="/deployments" variant="secondary">
            목록
          </LinkButton>
          <Button
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => setDeleteConfirmOpen(true)}
          >
            삭제
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>배포 상세 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="page-stack detail-edit-form" onSubmit={handleUpdate}>
            <LabeledSeparator label="서비스 정보" />
            <div className="form-grid">
              <DetailItem
                label="서비스"
                value={
                  <Link to={`/services/${deployment.serviceId}`}>
                    {deployment.serviceName}
                  </Link>
                }
              />
              <DetailItem
                label="버전"
                value={<code>{deployment.version}</code>}
              />
              <DetailItem
                label="배포 일시"
                value={formatDateTime(deployment.deployedAt)}
              />
              <DetailItem label="배포자" value={deployment.deployedBy} />
            </div>
            <LabeledSeparator label="배포 정보" />
            <div className="detail-grid">
              <EnvironmentField
                value={form.environment ?? "PRODUCTION"}
                onChange={(environment) =>
                  setForm((prev) => ({ ...prev, environment }))
                }
              />
              <DeploymentStatusField
                value={form.status ?? "SUCCESS"}
                onChange={(status) => setForm((prev) => ({ ...prev, status }))}
              />
              <BranchField
                value={form.branch ?? ""}
                onChange={(branch) => setForm((prev) => ({ ...prev, branch }))}
              />
              <CommitField
                value={form.commit ?? ""}
                onChange={(commit) => setForm((prev) => ({ ...prev, commit }))}
              />
              <DeploymentTimingFields
                startedAt={form.startedAt ?? ""}
                finishedAt={form.finishedAt ?? ""}
                onStartedAtChange={(startedAt) =>
                  setForm((prev) => ({ ...prev, startedAt }))
                }
                onFinishedAtChange={(finishedAt) =>
                  setForm((prev) => ({ ...prev, finishedAt }))
                }
              />
              <DetailItem
                label="소요 시간"
                value={formatDuration(deployment.durationSec)}
              />
              <RollbackField
                checked={Boolean(form.rollbacked)}
                onChange={(rollbacked) =>
                  setForm((prev) => ({ ...prev, rollbacked }))
                }
              />
            </div>
            <SummaryField
              label="배포 내용 요약"
              value={form.summary ?? ""}
              className="detail-edit-field-wide"
              onChange={(summary) => setForm((prev) => ({ ...prev, summary }))}
            />
            {showFailureReason && (
              <FailureReasonField
                value={form.failureReason ?? ""}
                className="detail-edit-field-wide"
                onChange={(failureReason) =>
                  setForm((prev) => ({ ...prev, failureReason }))
                }
              />
            )}
            <div className="readonly-section">
              <div className="readonly-section-title">변경사항</div>
              {deployment.changes.length === 0 ? (
                <div className="readonly-empty">변경사항이 없습니다.</div>
              ) : (
                <ul className="readonly-bullet-list">
                  {deployment.changes.map((change) => (
                    <li key={change.id}>
                      <div className="readonly-bullet-time">
                        <span className="readonly-bullet-dot" />
                        <span className="readonly-bullet-date">
                          {formatDateTime(deployment.deployedAt)}
                        </span>
                      </div>
                      <div className="readonly-bullet-content">
                        <strong>{change.changeType}</strong>
                        <span>{change.description}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="form-actions form-actions-center">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "저장 중" : "저장"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <SuccessDialog
        open={successOpen}
        title="배포 이력 수정 완료"
        description="배포 이력이 수정되었습니다."
        onOpenChange={setSuccessOpen}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="배포 이력 삭제"
        description="배포 이력을 삭제할까요? 삭제한 이력은 목록에서 제거됩니다."
        confirmLabel="삭제"
        confirming={deleteMutation.isPending}
        onConfirm={handleDelete}
        onOpenChange={setDeleteConfirmOpen}
      />
    </div>
  );
}

function LabeledSeparator({ label }: { label: string }) {
  return (
    <div className="detail-section-separator">
      <h3 className="detail-section-title">{label}</h3>
      <Separator className="detail-section-line" />
    </div>
  );
}

function DetailItem({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "detail-item detail-item-wide" : "detail-item"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
