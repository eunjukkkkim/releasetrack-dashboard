import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type {
  DeploymentListResponse,
  DeploymentSearchParams,
  PageResponse,
} from "../../api/types";
import { DeploymentList } from "./DeploymentList";

/**
 * 배포 이력 목록의 URL 쿼리 상태 검증.
 * 적용 상태(page/필터)가 URL의 단일 소스로 파생·커밋되는지 확인한다.
 * useDeployments는 서버 페이지네이션을 흉내내되, 넘겨받은 params를 캡처해
 * URL→params 파생(예: ?page=2)이 정확한지 검증한다.
 * 뒤로가기 자체(history pop)는 jsdom/MemoryRouter 한계로 미검증 —
 * URL→params 복원과 상태→URL 커밋으로 간접 검증한다.
 */

// useDeployments가 마지막으로 받은 params 캡처(URL→params 파생 검증용).
let lastParams: DeploymentSearchParams | undefined;

const ROWS: DeploymentListResponse[] = [
  {
    id: 1,
    serviceId: 1,
    serviceName: "customer-api",
    version: "1.0.0",
    environment: "PRODUCTION",
    status: "SUCCESS",
    branch: "main",
    deployedBy: "kim",
    deployedAt: "2026-06-01T10:00:00",
    summary: "release",
    rollbacked: false,
  },
];

function pageResponse(page: number): PageResponse<DeploymentListResponse> {
  return {
    content: ROWS,
    page,
    size: 20,
    totalElements: 60,
    totalPages: 3,
    first: page === 0,
    last: page >= 2,
  };
}

vi.mock("../../queries/deploymentQueries", () => ({
  useDeployments: (params: DeploymentSearchParams) => {
    lastParams = params;
    return {
      data: pageResponse(params.page ?? 0),
      isLoading: false,
      isError: false,
      error: null,
    };
  },
}));

vi.mock("../../queries/serviceQueries", () => ({
  useServices: () => ({ data: [], isLoading: false, isError: false, error: null }),
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="search">{location.search}</div>;
}

function currentSearch() {
  return screen.getByTestId("search").textContent ?? "";
}

function renderList(initialEntry = "/deployments") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <DeploymentList />
      <LocationProbe />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  cleanup();
  lastParams = undefined;
});

afterEach(cleanup);

describe("DeploymentList URL query state", () => {
  it("derives applied params (page + filters) from the URL on mount", () => {
    renderList("/deployments?page=2&serviceId=3&environment=PRODUCTION&status=SUCCESS&branch=main");
    expect(lastParams?.page).toBe(2);
    expect(lastParams?.serviceId).toBe(3);
    expect(lastParams?.environment).toBe("PRODUCTION");
    expect(lastParams?.status).toBe("SUCCESS");
    expect(lastParams?.branch).toBe("main");
  });

  it("clamps a negative page from the URL to 0", () => {
    renderList("/deployments?page=-5");
    expect(lastParams?.page).toBe(0);
  });

  it("restores the branch input filter from the URL on mount", () => {
    renderList("/deployments?branch=develop");
    expect(
      (screen.getByPlaceholderText("develop") as HTMLInputElement).value,
    ).toBe("develop");
  });

  it("commits the input filter to the URL on 조회 and resets page", () => {
    renderList("/deployments?page=2");
    const branch = screen.getByPlaceholderText("develop") as HTMLInputElement;
    fireEvent.change(branch, { target: { value: "release" } });
    fireEvent.click(screen.getByText("조회"));
    expect(currentSearch()).toBe("?branch=release");
    expect(lastParams?.page).toBe(0);
  });

  it("writes ?page= to the URL when paginating (preserving filters)", () => {
    renderList("/deployments?branch=main");
    fireEvent.click(screen.getByText("다음"));
    expect(currentSearch()).toBe("?branch=main&page=1");
    expect(lastParams?.page).toBe(1);
  });

  it("clears the URL query on 초기화", () => {
    renderList("/deployments?branch=main&page=2");
    fireEvent.click(screen.getByText("초기화"));
    expect(currentSearch()).toBe("");
  });
});
