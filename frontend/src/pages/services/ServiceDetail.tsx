import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage } from "../../api/client";
import type {
  DeploymentListResponse,
  ServiceUpdateRequest,
} from "../../api/types";
import { ConfirmDialog, SuccessDialog } from "../../components/FeedbackDialog";
import {
  DeploymentStatusTag,
  EnvironmentTag,
} from "../../components/StatusTag";
import { EmptyBox, ErrorBox, LoadingBox } from "../../components/StateBox";
import { formatDateTime } from "../../components/format";
import { LinkButton, Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Field, Input, Textarea } from "../../components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { SERVICE_STATUS_OPTIONS } from "../../constants/options";
import { useDeployments } from "../../queries/deploymentQueries";
import {
  useDeleteService,
  useService,
  useUpdateService,
} from "../../queries/serviceQueries";

export function ServiceDetail({ serviceId }: { serviceId: number }) {
  const navigate = useNavigate();
  const serviceQuery = useService(serviceId);
  const deploymentsQuery = useDeployments({ serviceId });
  const updateMutation = useUpdateService(serviceId);
  const deleteMutation = useDeleteService();
  const [successOpen, setSuccessOpen] = useState(false);
  const [successTitle, setSuccessTitle] = useState("완료");
  const [successMessage, setSuccessMessage] = useState("서비스가 수정되었습니다.");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [form, setForm] = useState<ServiceUpdateRequest>({});

  useEffect(() => {
    if (serviceQuery.data) {
      setForm({
        description: serviceQuery.data.description ?? "",
        repositoryUrl: serviceQuery.data.repositoryUrl ?? "",
        status: serviceQuery.data.status,
      });
    }
  }, [serviceQuery.data]);

  if (serviceQuery.isLoading) return <LoadingBox />;
  if (serviceQuery.isError || !serviceQuery.data)
    return <ErrorBox error={serviceQuery.error} />;

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    try {
      await updateMutation.mutateAsync(form);
      setSuccessTitle("서비스 수정 완료");
      setSuccessMessage("서비스가 수정되었습니다.");
      setSuccessOpen(true);
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  async function handleDelete() {
    try {
      if (hasDeployments) {
        await updateMutation.mutateAsync({ status: "ARCHIVED" });
        setDeleteConfirmOpen(false);
        setSuccessTitle("서비스 아카이브 완료");
        setSuccessMessage("서비스가 아카이브(비활성) 상태로 전환되었습니다.");
        setSuccessOpen(true);
      } else {
        await deleteMutation.mutateAsync(serviceId);
        setDeleteConfirmOpen(false);
        navigate("/services");
      }
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  // 복원: status='ACTIVE'로 전이해 다시 편집·배포 가능 상태로 되돌린다.
  async function handleRestore() {
    try {
      await updateMutation.mutateAsync({ status: "ACTIVE" });
      setSuccessTitle("서비스 복원 완료");
      setSuccessMessage("서비스가 복원되었습니다.");
      setSuccessOpen(true);
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  const service = serviceQuery.data;
  const isArchived = service.status === "ARCHIVED";
  const deploymentCount =
    deploymentsQuery.data?.totalElements ??
    deploymentsQuery.data?.content.length ??
    0;
  const hasDeployments = deploymentCount > 0;
  const isMutating = updateMutation.isPending || deleteMutation.isPending;
  const deleteDescription = hasDeployments
    ? "배포 이력이 있어 실제 삭제는 하지 않고, 이력 보존을 위해 아카이브(비활성) 상태로 전환합니다."
    : "배포 이력이 없는 서비스입니다. 이 서비스 데이터를 실제로 삭제할까요? 삭제 후에는 목록에서 제거됩니다.";

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>{service.name}</h1>
          <p>서비스 기본 정보와 배포 이력을 확인합니다.</p>
        </div>
        <div className="action-row">
          <LinkButton to="/services" variant="secondary">
            목록
          </LinkButton>
          {isArchived ? (
            <Button
              type="button"
              disabled={isMutating}
              onClick={handleRestore}
            >
              복원
            </Button>
          ) : (
            <Button
              variant="destructive"
              disabled={isMutating || deploymentsQuery.isLoading}
              onClick={() => setDeleteConfirmOpen(true)}
            >
              삭제
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>서비스 상세 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="page-stack detail-edit-form" onSubmit={handleUpdate}>
            <div className="form-grid">
              <DetailItem label="서비스 ID" value={service.id} />
              <DetailItem label="서비스명" value={service.name} />
              <DetailItem
                label="마지막 버전"
                value={
                  service.lastDeploymentVersion ? (
                    <code>{service.lastDeploymentVersion}</code>
                  ) : (
                    "-"
                  )
                }
              />
              <DetailItem
                label="마지막 배포"
                value={formatDateTime(service.lastDeployedAt)}
              />
              <Field label="저장소 URL">
                <Input
                  value={form.repositoryUrl ?? ""}
                  maxLength={500}
                  placeholder="https://github.com/example/repo"
                  disabled={isArchived}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      repositoryUrl: event.target.value,
                    }))
                  }
                />
              </Field>
              <DetailItem label="담당자" value={service.owner ?? "-"} />
              <Field label="상태">
                <Select
                  value={form.status ?? "ACTIVE"}
                  disabled={isArchived}
                  onValueChange={(val) => {
                    // ARCHIVED 선택은 '삭제' 버튼과 동일한 확인 모달(handleDelete)을 경유한다.
                    // form.status 를 직접 바꾸지 않으므로 모달 취소 시 controlled value 로 자동 원복된다
                    // (안내를 우회하지 않으면서 Select 도 삭제/아카이브 진입점이 됨).
                    if (val === "ARCHIVED") {
                      setDeleteConfirmOpen(true);
                      return;
                    }
                    setForm((prev) => ({
                      ...prev,
                      status: val as ServiceUpdateRequest["status"],
                    }));
                  }}
                >
                  <SelectTrigger aria-label="상태">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="설명" className="detail-edit-field-wide">
              <Textarea
                value={form.description ?? ""}
                rows={3}
                maxLength={500}
                placeholder="서비스에 대한 간단한 설명"
                disabled={isArchived}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </Field>
            {isArchived && (
              <p className="readonly-empty">
                아카이브(비활성) 상태입니다. 편집하려면 먼저 복원하세요.
              </p>
            )}
            <div className="form-actions form-actions-center">
              <Button
                type="submit"
                disabled={updateMutation.isPending || isArchived}
              >
                {updateMutation.isPending ? "저장 중" : "저장"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <SuccessDialog
        open={successOpen}
        title={successTitle}
        description={successMessage}
        onOpenChange={setSuccessOpen}
      />
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="서비스 삭제"
        description={deleteDescription}
        confirmLabel="삭제"
        confirming={isMutating}
        onConfirm={handleDelete}
        onOpenChange={setDeleteConfirmOpen}
      />

      <Card>
        <CardHeader>
          <CardTitle>배포 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {deploymentsQuery.isLoading ? (
            <LoadingBox />
          ) : deploymentsQuery.isError ? (
            <ErrorBox error={deploymentsQuery.error} />
          ) : (
            <DeploymentHistory rows={deploymentsQuery.data?.content ?? []} />
          )}
        </CardContent>
      </Card>
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

function DeploymentHistory({ rows }: { rows: DeploymentListResponse[] }) {
  if (rows.length === 0)
    return <EmptyBox description="배포 이력이 없습니다." />;
  return (
    <div className="rt-table-wrap">
      <table className="rt-table">
        <thead>
          <tr>
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
            <tr key={row.id}>
              <td className="rt-cell-mono">
                <Link to={`/deployments/${row.id}`}>{row.version}</Link>
              </td>
              <td>
                <EnvironmentTag environment={row.environment} />
              </td>
              <td>
                <DeploymentStatusTag status={row.status} />
              </td>
              <td>{row.deployedBy}</td>
              <td className="rt-cell-num">{formatDateTime(row.deployedAt)}</td>
              <td>{row.summary ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
