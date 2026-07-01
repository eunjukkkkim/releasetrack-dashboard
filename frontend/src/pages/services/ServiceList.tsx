import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "../../api/client";
import type {
  ServiceCreateRequest,
  ServiceResponse,
  ServiceSearchParams,
  ServiceStatus,
} from "../../api/types";
import { SuccessDialog } from "../../components/FeedbackDialog";
import { ServiceStatusTag } from "../../components/StatusTag";
import { ErrorBox, LoadingBox, EmptyBox } from "../../components/StateBox";
import { formatDateTime } from "../../components/format";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Field, Input, Textarea } from "../../components/ui/form";
import {
  SELECT_ALL,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  fromSelectValue,
  toSelectValue,
} from "../../components/ui/select";
import { TablePagination } from "../../components/ui/pagination";
import { paginate } from "../../lib/clientPagination";
import { SERVICE_STATUS_OPTIONS } from "../../constants/options";
import { useCreateService, useServices } from "../../queries/serviceQueries";
import { useUrlListState } from "../../hooks/useUrlListState";

const SERVICE_PAGE_SIZE = 10;
const EMPTY_SERVICE_FILTER = { keyword: "", status: "" };

/** URL 쿼리 → 적용 조회 params 파생(keyword/status enum 캐스팅). */
function readServiceParams(searchParams: URLSearchParams): ServiceSearchParams {
  return {
    keyword: searchParams.get("keyword") || undefined,
    status: (searchParams.get("status") || undefined) as
      | ServiceStatus
      | undefined,
  };
}

const DEFAULT_SERVICE_FORM: ServiceCreateRequest = {
  name: "",
  description: "",
  owner: "",
  repositoryUrl: "",
  status: "ACTIVE",
};

export function ServiceList() {
  // 적용 상태(필터·page)는 URL 단일 소스. 공통 훅이 useSearchParams·page 클램프·입력 filter 동기화를 캡슐화.
  const { searchParams, page, filter, setFilter, applyFilter, resetFilter, goToPage } =
    useUrlListState({ emptyFilter: EMPTY_SERVICE_FILTER });
  const params = readServiceParams(searchParams);
  const [form, setForm] = useState<ServiceCreateRequest>(DEFAULT_SERVICE_FORM);
  const [createOpen, setCreateOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const { data = [], isLoading, isError, error } = useServices(params);
  const createMutation = useCreateService();
  const paged = paginate(data, page, SERVICE_PAGE_SIZE);

  function handleFilter(event: FormEvent) {
    event.preventDefault();
    applyFilter();
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    try {
      await createMutation.mutateAsync(form);
      resetCreateForm();
      setCreateOpen(false);
      setSuccessOpen(true);
    } catch (mutationError) {
      toast.error(getErrorMessage(mutationError));
    }
  }

  function resetCreateForm() {
    setForm(DEFAULT_SERVICE_FORM);
  }

  function handleCreateOpenChange(nextOpen: boolean) {
    setCreateOpen(nextOpen);
    if (!nextOpen) {
      resetCreateForm();
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>Service List</h1>
          <p>서비스를 조회하고 새 관리 대상을 등록합니다.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus size={16} aria-hidden="true" />
          서비스 등록
        </Button>
      </div>

      <Card>
        <CardContent>
          <form className="filter-form" onSubmit={handleFilter}>
            <div className="filter-fields">
              <Field label="서비스명">
                <Input
                  value={filter.keyword}
                  placeholder="customer"
                  onChange={(event) =>
                    setFilter((prev) => ({
                      ...prev,
                      keyword: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="상태">
                <Select
                  value={toSelectValue(filter.status)}
                  onValueChange={(val) =>
                    setFilter((prev) => ({
                      ...prev,
                      status: fromSelectValue(val),
                    }))
                  }
                >
                  <SelectTrigger aria-label="상태">
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SELECT_ALL}>전체</SelectItem>
                    {SERVICE_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="form-actions form-actions-center">
              <Button type="button" variant="secondary" onClick={resetFilter}>
                초기화
              </Button>
              <Button type="submit">조회</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <LoadingBox />
      ) : isError ? (
        <ErrorBox error={error} />
      ) : (
        <>
          <div className="rt-table-count">총 {paged.totalElements}개</div>
          <ServiceTable rows={paged.rows} />
          {paged.totalElements > 0 && (
            <TablePagination
              page={paged.page}
              totalPages={paged.totalPages}
              totalElements={paged.totalElements}
              first={paged.first}
              last={paged.last}
              onPrev={() => goToPage(paged.page - 1)}
              onNext={() => goToPage(paged.page + 1)}
              onPageChange={goToPage}
            />
          )}
        </>
      )}

      <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent className="max-w-[720px]">
          <DialogHeader>
            <DialogTitle>서비스 등록</DialogTitle>
            <DialogDescription>
              새 관리 대상 서비스의 기본 정보를 입력합니다.
            </DialogDescription>
          </DialogHeader>
          <form className="page-stack" onSubmit={handleCreate}>
            <div className="form-grid">
              <Field label="서비스명">
                <Input
                  required
                  maxLength={100}
                  placeholder="customer-web"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </Field>
              <Field label="담당자">
                <Input
                  maxLength={100}
                  placeholder="frontend-team"
                  value={form.owner}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, owner: event.target.value }))
                  }
                />
              </Field>
              <Field label="저장소 URL">
                <Input
                  maxLength={500}
                  placeholder="https://github.com/example/repo"
                  value={form.repositoryUrl}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      repositoryUrl: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="상태">
                <Select
                  value={form.status}
                  onValueChange={(val) =>
                    setForm((prev) => ({
                      ...prev,
                      status: val as ServiceStatus,
                    }))
                  }
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
            <Field label="설명">
              <Textarea
                rows={3}
                maxLength={500}
                placeholder="서비스에 대한 간단한 설명"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
              />
            </Field>
            <DialogFooter className="sm:justify-center">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleCreateOpenChange(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "등록 중" : "등록"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <SuccessDialog
        open={successOpen}
        title="서비스 등록 완료"
        description="서비스가 등록되었습니다."
        onOpenChange={setSuccessOpen}
      />
    </div>
  );
}

function ServiceTable({ rows }: { rows: ServiceResponse[] }) {
  const navigate = useNavigate();
  if (rows.length === 0) {
    return <EmptyBox description="서비스가 없습니다." />;
  }
  return (
    <Card>
      <CardContent>
        <div className="rt-table-wrap">
          <table className="rt-table">
            <thead>
              <tr>
                <th>서비스명</th>
                <th>담당자</th>
                <th>상태</th>
                <th>저장소 URL</th>
                <th>마지막 버전</th>
                <th>마지막 배포</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="rt-clickable-row"
                  tabIndex={0}
                  onClick={() => navigate(`/services/${row.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      navigate(`/services/${row.id}`);
                    }
                  }}
                >
                  <td>
                    <Link to={`/services/${row.id}`}>{row.name}</Link>
                  </td>
                  <td>{row.owner ?? "-"}</td>
                  <td>
                    <ServiceStatusTag status={row.status} />
                  </td>
                  <td className="rt-truncate">
                    {row.repositoryUrl ? (
                      <a
                        href={row.repositoryUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {row.repositoryUrl}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="rt-cell-mono">
                    {row.lastDeploymentVersion ?? "-"}
                  </td>
                  <td className="rt-cell-num">
                    {formatDateTime(row.lastDeployedAt)}
                  </td>
                  <td>
                    <Link to={`/services/${row.id}`}>보기</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function serviceStatusOptions() {
  return SERVICE_STATUS_OPTIONS;
}
