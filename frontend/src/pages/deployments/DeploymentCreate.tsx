import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getErrorMessage } from "../../api/client";
import type { ChangeType } from "../../api/types";
import { SuccessDialog } from "../../components/FeedbackDialog";
import { LinkButton, Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Field, Input } from "../../components/ui/form";
import { DateTimePicker } from "../../components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { CHANGE_TYPE_OPTIONS } from "../../constants/options";
import { useCreateDeployment } from "../../queries/deploymentQueries";
import { useServices } from "../../queries/serviceQueries";
import {
  BranchField,
  CommitField,
  DeploymentStatusField,
  DeploymentTimingFields,
  EnvironmentField,
  FailureReasonField,
  RollbackField,
  ServiceSelectField,
  SummaryField,
} from "./DeploymentFormFields";
import {
  DEFAULT_DEPLOYMENT_CREATE_FORM,
  toDeploymentCreateRequest,
  type DeploymentCreateFormValues,
} from "./deploymentForm";

export function DeploymentCreate() {
  const navigate = useNavigate();
  const servicesQuery = useServices();
  const createMutation = useCreateDeployment();
  const [successOpen, setSuccessOpen] = useState(false);
  const [form, setForm] = useState<DeploymentCreateFormValues>(
    DEFAULT_DEPLOYMENT_CREATE_FORM,
  );

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    // Radix Select(합성)는 native `required`로 미선택을 막지 못하므로 명시적으로 차단한다.
    if (!form.serviceId) {
      toast.error("서비스를 선택해주세요.");
      return;
    }
    try {
      await createMutation.mutateAsync(toDeploymentCreateRequest(form));
      setSuccessOpen(true);
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>Deployment Create</h1>
          <p>서비스별 배포 결과와 변경사항을 등록합니다.</p>
        </div>
        <LinkButton to="/deployments" variant="secondary">
          목록
        </LinkButton>
      </div>

      <Card>
        <CardContent>
          <form className="page-stack" onSubmit={handleCreate}>
            <div className="form-grid">
              <ServiceSelectField
                services={servicesQuery.data ?? []}
                value={form.serviceId}
                onChange={(serviceId) =>
                  setForm((prev) => ({ ...prev, serviceId }))
                }
              />
              <Field label="버전">
                <Input
                  required
                  maxLength={50}
                  placeholder="v1.2.5"
                  value={form.version}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      version: event.target.value,
                    }))
                  }
                />
              </Field>
              <EnvironmentField
                value={form.environment}
                onChange={(environment) =>
                  setForm((prev) => ({ ...prev, environment }))
                }
              />
              <DeploymentStatusField
                value={form.status}
                onChange={(status) => setForm((prev) => ({ ...prev, status }))}
              />
              <Field label="배포자">
                <Input
                  required
                  maxLength={100}
                  placeholder="mason"
                  value={form.deployedBy}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      deployedBy: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="배포 일시">
                <DateTimePicker
                  required
                  aria-label="배포 일시"
                  value={form.deployedAt}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, deployedAt: value }))
                  }
                />
              </Field>
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
            </div>

            <SummaryField
              value={form.summary ?? ""}
              onChange={(summary) => setForm((prev) => ({ ...prev, summary }))}
            />
            <FailureReasonField
              value={form.failureReason ?? ""}
              onChange={(failureReason) =>
                setForm((prev) => ({ ...prev, failureReason }))
              }
            />
            <RollbackField
              checked={Boolean(form.rollbacked)}
              onChange={(rollbacked) =>
                setForm((prev) => ({ ...prev, rollbacked }))
              }
            />

            <div className="tool-panel">
              <div className="tool-panel-title">변경사항</div>
              <div className="page-stack">
                {(form.changes ?? []).map((change, index) => (
                  <div className="change-row" key={index}>
                    <Field label="유형">
                      <Select
                        value={change.changeType}
                        onValueChange={(val) => {
                          const next = [...(form.changes ?? [])];
                          next[index] = {
                            ...next[index],
                            changeType: val as ChangeType,
                          };
                          setForm((prev) => ({ ...prev, changes: next }));
                        }}
                      >
                        <SelectTrigger aria-label="유형">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CHANGE_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="내용">
                      <Input
                        placeholder="변경 내용 입력"
                        value={change.description}
                        onChange={(event) => {
                          const next = [...(form.changes ?? [])];
                          next[index] = {
                            ...next[index],
                            description: event.target.value,
                          };
                          setForm((prev) => ({ ...prev, changes: next }));
                        }}
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          changes:
                            prev.changes?.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ) ?? [],
                        }))
                      }
                    >
                      삭제
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      changes: [
                        ...(prev.changes ?? []),
                        { changeType: "ETC", description: "" },
                      ],
                    }))
                  }
                >
                  변경사항 추가
                </Button>
              </div>
            </div>

            <div className="form-actions form-actions-center">
              <LinkButton to="/deployments" variant="secondary">
                취소
              </LinkButton>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "등록 중" : "등록"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <SuccessDialog
        open={successOpen}
        title="배포 이력 등록 완료"
        description="배포 이력이 등록되었습니다. 목록으로 이동합니다."
        onOpenChange={(open) => {
          setSuccessOpen(open);
          if (!open) {
            navigate("/deployments");
          }
        }}
      />
    </div>
  );
}
