import { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import type {
  DeploymentEnvironment,
  DeploymentListResponse,
  DeploymentSearchParams,
  DeploymentStatus,
} from "../../api/types";
import {
  DeploymentStatusTag,
  EnvironmentTag,
} from "../../components/StatusTag";
import { EmptyBox, ErrorBox, LoadingBox } from "../../components/StateBox";
import { formatDateTime } from "../../components/format";
import { LinkButton, Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Field, Input } from "../../components/ui/form";
import { DatePicker } from "../../components/ui/date-picker";
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
import {
  DEPLOYMENT_ENVIRONMENT_OPTIONS,
  DEPLOYMENT_STATUS_OPTIONS,
} from "../../constants/options";
import { useDeployments } from "../../queries/deploymentQueries";
import { useServices } from "../../queries/serviceQueries";
import { useUrlListState } from "../../hooks/useUrlListState";

const DEFAULT_PAGE_SIZE = 20;
const EMPTY_DEPLOYMENT_FILTER = {
  serviceId: "",
  environment: "",
  status: "",
  branch: "",
  from: "",
  to: "",
};

/** URL 쿼리 + 클램프된 page → useDeployments에 넘길 typed 적용 params 파생(serviceId 숫자·enum 캐스팅·size 상수). */
function readDeploymentParams(
  searchParams: URLSearchParams,
  page: number,
): DeploymentSearchParams {
  const serviceIdRaw = searchParams.get("serviceId");
  const serviceIdNum = serviceIdRaw ? Number(serviceIdRaw) : NaN;
  return {
    serviceId: Number.isFinite(serviceIdNum) ? serviceIdNum : undefined,
    environment: (searchParams.get("environment") || undefined) as
      | DeploymentEnvironment
      | undefined,
    status: (searchParams.get("status") || undefined) as
      | DeploymentStatus
      | undefined,
    branch: searchParams.get("branch")?.trim() || undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    page,
    size: DEFAULT_PAGE_SIZE,
  };
}

export function DeploymentList() {
  // 적용 상태(필터·page)는 URL 단일 소스. 공통 훅이 useSearchParams·page 클램프·입력 filter 동기화를 캡슐화.
  const { searchParams, page, filter, setFilter, applyFilter, resetFilter, goToPage } =
    useUrlListState({ emptyFilter: EMPTY_DEPLOYMENT_FILTER });
  const params = readDeploymentParams(searchParams, page);
  const { data, isLoading, isError, error } = useDeployments(params);
  const servicesQuery = useServices();

  function handleFilter(event: FormEvent) {
    event.preventDefault();
    applyFilter();
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <h1>Deployment List</h1>
          <p>환경, 상태, 서비스 기준으로 배포 이력을 조회합니다.</p>
        </div>
        <LinkButton to="/deployments/create">
          <Plus size={16} aria-hidden="true" />
          배포 이력 등록
        </LinkButton>
      </div>

      <Card>
        <CardContent>
          <form className="filter-form" onSubmit={handleFilter}>
            <div className="filter-fields">
            <Field label="서비스">
              <Select
                value={toSelectValue(filter.serviceId)}
                onValueChange={(val) =>
                  setFilter((prev) => ({
                    ...prev,
                    serviceId: fromSelectValue(val),
                  }))
                }
              >
                <SelectTrigger aria-label="서비스">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_ALL}>전체</SelectItem>
                  {(servicesQuery.data ?? []).map((service) => (
                    <SelectItem key={service.id} value={String(service.id)}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="환경">
              <Select
                value={toSelectValue(filter.environment)}
                onValueChange={(val) =>
                  setFilter((prev) => ({
                    ...prev,
                    environment: fromSelectValue(val),
                  }))
                }
              >
                <SelectTrigger aria-label="환경">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_ALL}>전체</SelectItem>
                  {DEPLOYMENT_ENVIRONMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  {DEPLOYMENT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="브랜치">
              <Input
                placeholder="develop"
                value={filter.branch}
                onChange={(event) =>
                  setFilter((prev) => ({ ...prev, branch: event.target.value }))
                }
              />
            </Field>
            <Field label="시작일">
              <DatePicker
                aria-label="시작일"
                placeholder="전체"
                value={filter.from}
                onChange={(value) =>
                  setFilter((prev) => ({ ...prev, from: value }))
                }
              />
            </Field>
            <Field label="종료일">
              <DatePicker
                aria-label="종료일"
                placeholder="전체"
                value={filter.to}
                onChange={(value) =>
                  setFilter((prev) => ({ ...prev, to: value }))
                }
              />
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
          <div className="rt-table-count">총 {data?.totalElements ?? 0}건</div>
          <DeploymentTable rows={data?.content ?? []} />
          {data && data.content.length > 0 && (
            <TablePagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              first={data.first}
              last={data.last}
              onPrev={() => goToPage(page - 1)}
              onNext={() => goToPage(page + 1)}
              onPageChange={goToPage}
            />
          )}
        </>
      )}
    </div>
  );
}

function DeploymentTable({ rows }: { rows: DeploymentListResponse[] }) {
  const navigate = useNavigate();
  if (rows.length === 0) {
    return <EmptyBox description="배포 이력이 없습니다." />;
  }
  return (
    <Card>
      <CardContent>
        <div className="rt-table-wrap">
          <table className="rt-table">
            <thead>
              <tr>
                <th>서비스</th>
                <th>버전</th>
                <th>환경</th>
                <th>브랜치</th>
                <th>상태</th>
                <th>배포자</th>
                <th>배포일시</th>
                <th>요약</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="rt-clickable-row"
                  tabIndex={0}
                  onClick={() => navigate(`/deployments/${row.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      navigate(`/deployments/${row.id}`);
                    }
                  }}
                >
                  <td>
                    <Link to={`/deployments/${row.id}`}>{row.serviceName}</Link>
                  </td>
                  <td className="rt-cell-mono">{row.version}</td>
                  <td>
                    <EnvironmentTag environment={row.environment} />
                  </td>
                  <td className="rt-cell-mono">{row.branch ?? "-"}</td>
                  <td>
                    <DeploymentStatusTag status={row.status} />
                  </td>
                  <td>{row.deployedBy}</td>
                  <td className="rt-cell-num">
                    {formatDateTime(row.deployedAt)}
                  </td>
                  <td className="rt-truncate">{row.summary ?? "-"}</td>
                  <td>
                    <Link to={`/deployments/${row.id}`}>보기</Link>
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

export function environmentOptions() {
  return DEPLOYMENT_ENVIRONMENT_OPTIONS;
}

export function deploymentStatusOptions() {
  return DEPLOYMENT_STATUS_OPTIONS;
}
