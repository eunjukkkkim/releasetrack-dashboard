import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { useUrlListState } from "./useUrlListState";

/**
 * 공통 URL 리스트 상태 훅의 계약 검증(두 리스트가 공유하는 로직).
 * page 클램프 / applyFilter 커밋(빈값·공백 제외) / resetFilter 비움 / goToPage 필터 보존 /
 * 마운트 시 URL→입력 filter 복원을 MemoryRouter + LocationProbe로 검증한다.
 */

const EMPTY = { keyword: "", status: "" };

function Harness() {
  const { page, filter, setFilter, applyFilter, resetFilter, goToPage } =
    useUrlListState({ emptyFilter: EMPTY });
  const location = useLocation();
  return (
    <div>
      <div data-testid="search">{location.search}</div>
      <div data-testid="page">{page}</div>
      <input
        aria-label="keyword"
        value={filter.keyword}
        onChange={(event) =>
          setFilter((prev) => ({ ...prev, keyword: event.target.value }))
        }
      />
      <button type="button" onClick={applyFilter}>
        apply
      </button>
      <button type="button" onClick={resetFilter}>
        reset
      </button>
      <button type="button" onClick={() => goToPage(page + 1)}>
        next
      </button>
    </div>
  );
}

function renderHarness(initialEntry = "/list") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Harness />
    </MemoryRouter>,
  );
}

function search() {
  return screen.getByTestId("search").textContent ?? "";
}

beforeEach(cleanup);
afterEach(cleanup);

describe("useUrlListState", () => {
  it("clamps a negative/NaN page from the URL to 0", () => {
    renderHarness("/list?page=-5");
    expect(screen.getByTestId("page").textContent).toBe("0");
  });

  it("derives a valid page from the URL", () => {
    renderHarness("/list?page=3");
    expect(screen.getByTestId("page").textContent).toBe("3");
  });

  it("restores the input filter from the URL on mount", () => {
    renderHarness("/list?keyword=payments");
    expect(
      (screen.getByLabelText("keyword") as HTMLInputElement).value,
    ).toBe("payments");
  });

  it("applyFilter commits the trimmed filter to the URL, excluding empty values", () => {
    renderHarness();
    fireEvent.change(screen.getByLabelText("keyword"), {
      target: { value: "  payments  " },
    });
    fireEvent.click(screen.getByText("apply"));
    // status는 빈 값이라 제외, keyword는 trim되어 커밋, page는 생략(0 리셋).
    expect(search()).toBe("?keyword=payments");
  });

  it("resetFilter clears the URL query", () => {
    renderHarness("/list?keyword=payments&page=2");
    fireEvent.click(screen.getByText("reset"));
    expect(search()).toBe("");
  });

  it("goToPage preserves existing filters and updates only page", () => {
    renderHarness("/list?keyword=payments");
    fireEvent.click(screen.getByText("next"));
    expect(search()).toBe("?keyword=payments&page=1");
    expect(screen.getByTestId("page").textContent).toBe("1");
  });
});
