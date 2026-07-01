import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { ServiceResponse } from "../../api/types";
import { ServiceList } from "./ServiceList";

/**
 * 클라이언트 사이드 페이지네이션 + 초기화 상호작용 회귀 가드 + URL 쿼리 상태 검증.
 * 빌드/타입/순수테스트로는 못 잡는 클릭 경로(페이지 이동, 초기화로 필드 비워짐)와,
 * 적용 상태(page/필터)가 URL 쿼리에 반영·복원되는지를 검증한다.
 * useServices는 params와 무관하게 고정 목록을 반환하도록 mock한다(페이지네이션은 화면에서 slice).
 * 뒤로가기 자체(history pop)는 jsdom/MemoryRouter 한계로 여기서는 미검증 —
 * 대신 URL→상태 복원(?page=1 진입)과 상태→URL 커밋(조회/초기화)으로 간접 검증한다.
 */

// 현재 location.search를 노출하는 프로브. 조회/초기화/페이지 이동이 URL을 갱신하는지 확인.
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="search">{location.search}</div>;
}

function currentSearch() {
  return screen.getByTestId("search").textContent ?? "";
}

// 참조 안정성: 렌더마다 새 배열/객체를 만들면 불필요한 재조회 유발 → 모듈 스코프에 고정.
const SERVICES: ServiceResponse[] = Array.from({ length: 23 }, (_, index) => ({
  id: index + 1,
  name: `svc-${String(index + 1).padStart(2, "0")}`,
  description: "",
  owner: "kim",
  repositoryUrl: "",
  status: "ACTIVE",
  lastDeploymentVersion: null,
  lastDeployedAt: null,
  createdAt: "2026-06-01T10:00:00",
  updatedAt: "2026-06-01T10:00:00",
}));

vi.mock("../../queries/serviceQueries", () => ({
  useServices: () => ({
    data: SERVICES,
    isLoading: false,
    isError: false,
    error: null,
  }),
  useCreateService: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function renderList(initialEntry = "/services") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <ServiceList />
      <LocationProbe />
    </MemoryRouter>,
  );
}

function getPageLink(page: number) {
  return screen.getByRole("link", {
    name: new RegExp(`${page} 페이지`),
  }) as HTMLAnchorElement;
}

beforeEach(() => {
  cleanup();
});

afterEach(cleanup);

describe("ServiceList client pagination + reset", () => {
  it("shows total count and only the first page (10 rows)", () => {
    renderList();
    expect(screen.getByText("총 23개")).not.toBeNull();
    expect(screen.getByText("svc-01")).not.toBeNull();
    expect(screen.getByText("svc-10")).not.toBeNull();
    expect(screen.queryByText("svc-11")).toBeNull();
    expect(getPageLink(1).getAttribute("aria-current")).toBe("page");
    expect(getPageLink(2)).not.toBeNull();
    expect(getPageLink(3)).not.toBeNull();
  });

  it("advances to the next page slice when 다음 is clicked", () => {
    renderList();
    fireEvent.click(screen.getByText("다음"));
    expect(screen.getByText("svc-11")).not.toBeNull();
    expect(screen.getByText("svc-20")).not.toBeNull();
    expect(screen.queryByText("svc-01")).toBeNull();
    expect(getPageLink(2).getAttribute("aria-current")).toBe("page");
  });

  it("resets page to the first when 초기화 is clicked", () => {
    renderList();
    fireEvent.click(screen.getByText("다음"));
    expect(getPageLink(2).getAttribute("aria-current")).toBe("page");
    fireEvent.click(screen.getByText("초기화"));
    expect(getPageLink(1).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("svc-01")).not.toBeNull();
  });

  it("clears the keyword filter input when 초기화 is clicked", () => {
    renderList();
    const keyword = screen.getByPlaceholderText("customer") as HTMLInputElement;
    fireEvent.change(keyword, { target: { value: "payments" } });
    expect(keyword.value).toBe("payments");
    fireEvent.click(screen.getByText("초기화"));
    expect(
      (screen.getByPlaceholderText("customer") as HTMLInputElement).value,
    ).toBe("");
  });
});

describe("ServiceList URL query state", () => {
  it("applies the page from ?page= on mount (2nd page slice)", () => {
    renderList("/services?page=1");
    expect(screen.getByText("svc-11")).not.toBeNull();
    expect(screen.getByText("svc-20")).not.toBeNull();
    expect(screen.queryByText("svc-01")).toBeNull();
    expect(getPageLink(2).getAttribute("aria-current")).toBe("page");
  });

  it("commits the applied filter to the URL on 조회", () => {
    renderList();
    const keyword = screen.getByPlaceholderText("customer") as HTMLInputElement;
    fireEvent.change(keyword, { target: { value: "payments" } });
    fireEvent.click(screen.getByText("조회"));
    expect(currentSearch()).toBe("?keyword=payments");
  });

  it("writes ?page= to the URL when paginating", () => {
    renderList();
    fireEvent.click(screen.getByText("다음"));
    expect(currentSearch()).toBe("?page=1");
  });

  it("clears the URL query on 초기화", () => {
    renderList("/services?keyword=payments&page=1");
    expect(currentSearch()).toBe("?keyword=payments&page=1");
    fireEvent.click(screen.getByText("초기화"));
    expect(currentSearch()).toBe("");
  });

  it("restores the input filter from the URL on mount", () => {
    renderList("/services?keyword=payments");
    expect(
      (screen.getByPlaceholderText("customer") as HTMLInputElement).value,
    ).toBe("payments");
  });
});
