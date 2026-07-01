import { Dispatch, SetStateAction, useState } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * 리스트 화면의 "적용(조회 실행된) 조회 상태 = URL 쿼리 단일 소스" 규약을 캡슐화한 공통 훅.
 *
 * - 적용 필터/현재 page는 URL(`useSearchParams`)이 단일 소스 → 상세 이동 후 뒤로가기·새로고침·공유에도 유지.
 * - 입력 `filter`는 로컬 state이되 마운트 시 URL에서 lazy 초기화(뒤로가기로 remount되면 폼도 복원).
 *   타이핑은 로컬에만 반영되고, `applyFilter()`(조회)를 호출해야 URL에 커밋된다(기존 UX 보존).
 * - filterKeys는 `Object.keys(emptyFilter)`로 파생하므로 리스트마다 emptyFilter 형태만 넘기면 된다.
 *
 * page는 0-기반(백엔드 PageResponse / clientPagination 규약과 동일)이며, 음수·NaN은 0으로 클램프한다.
 * 상한 클램프는 총 페이지 수를 아는 소비측(서버 응답 / `paginate`)에서 처리한다.
 */
export interface UseUrlListStateOptions<F extends Record<string, string>> {
  emptyFilter: F;
}

export interface UseUrlListStateResult<F extends Record<string, string>> {
  searchParams: URLSearchParams;
  page: number;
  filter: F;
  setFilter: Dispatch<SetStateAction<F>>;
  applyFilter: () => void;
  resetFilter: () => void;
  goToPage: (page: number) => void;
}

/** URL 쿼리에서 page 파생(음수·NaN·비수치 → 0 클램프). */
function readPage(searchParams: URLSearchParams): number {
  const raw = Number(searchParams.get("page"));
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
}

/** URL 쿼리에서 입력 filter를 복원(마운트/뒤로가기 시 폼 동기화). emptyFilter 키만 읽는다. */
function readFilter<F extends Record<string, string>>(
  searchParams: URLSearchParams,
  emptyFilter: F,
): F {
  const next: Record<string, string> = { ...emptyFilter };
  for (const key of Object.keys(emptyFilter)) {
    next[key] = searchParams.get(key) ?? "";
  }
  return next as F;
}

/** 입력 filter → 빈 값·공백 제외한 URL 쿼리 레코드(page 미포함 → 커밋 시 0페이지 리셋). */
function buildFilterQuery<F extends Record<string, string>>(
  filter: F,
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(filter)) {
    const trimmed = value.trim();
    if (trimmed) query[key] = trimmed;
  }
  return query;
}

export function useUrlListState<F extends Record<string, string>>({
  emptyFilter,
}: UseUrlListStateOptions<F>): UseUrlListStateResult<F> {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = readPage(searchParams);
  // 입력 filter는 로컬이되 마운트 시 URL로 초기화(remount되는 뒤로가기에서 폼 복원).
  const [filter, setFilter] = useState<F>(() =>
    readFilter(searchParams, emptyFilter),
  );

  function applyFilter() {
    // 조회: 입력 filter를 URL에 커밋(빈 값·공백 제외, page 생략 → 0 리셋).
    setSearchParams(buildFilterQuery(filter));
  }

  function resetFilter() {
    setFilter(emptyFilter);
    setSearchParams({});
  }

  function goToPage(nextPage: number) {
    // 현재 URL의 적용 필터를 보존한 채 page만 갱신(0이면 생략).
    const clamped = Math.max(nextPage, 0);
    const query: Record<string, string> = {};
    for (const key of Object.keys(emptyFilter)) {
      const value = searchParams.get(key);
      if (value) query[key] = value;
    }
    if (clamped > 0) query.page = String(clamped);
    setSearchParams(query);
  }

  return { searchParams, page, filter, setFilter, applyFilter, resetFilter, goToPage };
}
