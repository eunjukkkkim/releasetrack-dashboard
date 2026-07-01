/**
 * 클라이언트 사이드 페이지네이션 헬퍼.
 *
 * 백엔드가 비페이지네이션 목록(예: 서비스 `List<ServiceResponse>`)을 내려줄 때,
 * 화면에서 현재 페이지 slice와 Pagination 컴포넌트가 요구하는 메타
 * (page/totalPages/totalElements/first/last)를 순수 함수로 계산한다.
 * page는 0-기반(백엔드 PageResponse와 동일 규약)이며, 범위를 벗어난 page는 클램프한다.
 */
export interface ClientPage<T> {
  rows: T[];
  page: number;
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
}

export function paginate<T>(items: T[], page: number, size: number): ClientPage<T> {
  const totalElements = items.length;
  const totalPages = Math.max(Math.ceil(totalElements / size), 1);
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * size;
  const rows = items.slice(start, start + size);
  return {
    rows,
    page: safePage,
    totalPages,
    totalElements,
    first: safePage === 0,
    last: safePage >= totalPages - 1,
  };
}
