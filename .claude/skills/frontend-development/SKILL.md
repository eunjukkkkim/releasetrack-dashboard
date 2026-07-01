---
name: frontend-development
description: ReleaseTrack Dashboard의 React/TypeScript 프론트엔드(Vite, TanStack Query, Axios, react-router-dom, shadcn 스타일 로컬 UI) 구현 규약. src의 api/types/queries/hooks/pages/components를 추가·수정하거나, 새 화면·데이터 패칭 hook·API 함수·TS 타입을 만들 때 반드시 사용한다. frontend/ 디렉토리의 TS/TSX 코드를 다루는 모든 작업에 적용.
---

# Frontend Development — React/TS 대시보드 구현 규약

ReleaseTrack Dashboard 프론트엔드(`frontend/`)의 코드를 작성·수정할 때 따르는 규약. 목표는 **기존 코드와 구분되지 않는 코드**를 작성하는 것이다.

## 기술 스택

- React + TypeScript, Vite
- TanStack Query (서버 상태), Axios (HTTP)
- react-router-dom (라우팅)
- shadcn 스타일 로컬 UI primitives (`src/components/ui`) — Ant Design 등 외부 UI 미사용

## 디렉토리 역할

| 경로                                          | 역할                                                 |
| --------------------------------------------- | ---------------------------------------------------- |
| `src/api/client.ts`                           | Axios 인스턴스(`apiClient`), `getErrorMessage` 헬퍼  |
| `src/api/types.ts`                            | **모든 API 타입의 단일 소스.** 백엔드 DTO와 1:1 대응 |
| `src/api/{dashboard,deployments,services}.ts` | 엔드포인트별 API 호출 함수                           |
| `src/queries/*Queries.ts`                     | TanStack Query 조회/뮤테이션 hook                    |
| `src/hooks/`                                  | 재사용 hook (예: `useDashboardSummary`)              |
| `src/pages/`                                  | 라우트 화면 컴포넌트                                 |
| `src/components/`                             | StatusTag, StateBox, format 유틸                     |
| `src/components/ui/`                          | Button/Card/Badge/Input/Select/Alert 등 primitive    |

## 필수 컨벤션

1. **타입 정의 위치**: 모든 API 타입은 `src/api/types.ts`에 둔다. 화면/쿼리에 인라인 타입을 흩뿌리지 않는다.
2. **데이터 패칭**: 화면에서 직접 axios를 호출하지 않는다. `src/api/*.ts` 함수 → `src/queries/*.ts`의 TanStack Query hook → 화면 순으로 계층을 지킨다. 기존 쿼리 키 패턴을 따른다.
3. **에러 처리**: API 에러 메시지는 `getErrorMessage(error)`로 추출한다(백엔드 `fieldErrors`를 사람이 읽는 메시지로 변환). 직접 파싱하지 않는다.
4. **로딩/에러/빈 상태**: 기존 `StateBox`/`src/components/ui/state` 컴포넌트를 재사용한다. 화면마다 일관된 상태 표시를 유지한다.
5. **상태/배지**: 상태값 표시는 `StatusTag`/`Badge`로 통일한다.
6. **스타일**: `frontend/docs/DESIGN.md`의 디자인 토큰(dark obsidian shell, mint content card, neon green primary)을 따른다. 새 색/컴포넌트를 즉흥 도입하지 않는다.

## 타입 ↔ 백엔드 경계 일치 (가장 중요)

`src/api/types.ts`는 백엔드 Response DTO와 정확히 일치해야 한다:

- **필드명**: 백엔드 camelCase와 동일.
- **nullable**: 백엔드에서 null 가능한 필드는 `| null`로 선언한다. 예: `lastDeployedAt: string | null`, `daysSinceLastDeployment: number | null`, `failureReason: string | null`. 이를 누락하면 런타임에서 깨진다.
- **enum/union**: 백엔드 enum과 동일한 문자열 union으로 선언한다. 예: `type DeploymentStatus = 'SUCCESS' | 'FAILED' | 'ROLLBACK' | 'IN_PROGRESS'`. 백엔드에 값이 추가되면 여기도 추가한다.
- **날짜**: 모두 `string`(ISO-8601).
- 응답 타입 간 상속 관계를 활용한다(예: `DeploymentResponse extends DeploymentListResponse`).

## 작업 순서 (새 화면/기능 추가 시)

1. 경계 계약(`_workspace/01_analyst_contract.md`)과 backend done 파일(`_workspace/02_backend_done.md`)의 실제 응답 shape 확인.
2. `src/api/types.ts`에 타입 추가/갱신 (nullable·union 정확히).
3. `src/api/*.ts`에 호출 함수 추가.
4. `src/queries/*.ts`에 TanStack Query hook 추가.
5. `src/pages/`(+ 필요 시 `src/components/`)에 화면 구현 — 기존 화면 패턴 모방.
6. 검증: `cd frontend && npm run build` (타입 체크 + 빌드 통과).
7. `_workspace/03_frontend_done.md`에 추가/수정 내역과 소비하는 shape 기록.

## shadcn/Radix 상호작용 규칙 (필수 — 과거 실전 버그 기반)

이 프로젝트는 shadcn/ui(Radix UI + cva + clsx/tailwind-merge, Tailwind v4)를 쓴다. 아래는 "빌드·타입·단위테스트는 통과하지만 런타임 클릭이 죽는" 부류의 버그를 막기 위한 규칙이다.

- **`asChild`/Slot로 감싸는 커스텀 자식은 반드시 나머지 props를 DOM 노드에 spread하라.** Radix의 `<XxxTrigger asChild>`·`<Slot>`은 `cloneElement`로 자식에 `onClick`/`onPointerDown`/`data-state`/`aria-expanded`/`aria-controls`/`ref` 등을 주입한다. 자식 컴포넌트가 자기 named props만 쓰고 `{...rest}`를 빠뜨리면 그 핸들러가 실제 `<button>`/요소에 도달하지 못해 **클릭해도 아무 일도 안 일어난다**. 커스텀 트리거는 `forwardRef` + `{...rest}` spread를 둘 다 갖춰라. (실제 사례: DatePicker 트리거가 `...rest`를 안 넘겨 팝오버가 안 열림.)
- **이 결함은 `npm run build`·타입체크·순수함수 단위테스트로 못 잡는다.** TS는 asChild 자식의 누락 prop을 모르고, 순수 로직 테스트는 상호작용을 안 본다. 따라서:
- **상호작용 컴포넌트(Radix Popover/Dialog/Select/Tooltip 등, asChild 트리거 포함)는 렌더/상호작용 테스트를 반드시 추가하라.** 최소 1개: 트리거 클릭 → 열림 검증(예: `fireEvent.click(trigger)` 후 `aria-expanded === 'true'` 또는 콘텐츠 등장). vitest + Testing Library 사용. jsdom에서 Radix가 필요로 하는 폴리필(`hasPointerCapture`/`setPointerCapture`/`releasePointerCapture`/`scrollIntoView`/`matchMedia`/`ResizeObserver`)은 `src/test/setup.ts`에 이미 있으니 신규 Radix 컴포넌트 추가 시 부족분을 보강한다.
- **완료 보고 전, 빌드·타입·테스트 통과만으로 "동작한다"고 단정하지 마라.** 상호작용을 바꾼 변경은 위 렌더 테스트로 클릭 경로를 실제 검증한 뒤 보고한다(가능하면 `npm run dev`로 눈으로도 확인).
- Radix Select는 `value=""`를 거부한다 → 빈/전체 옵션은 sentinel(`SELECT_ALL='__ALL'`)로 처리하고 소비측에서 `''`/`undefined`로 환원한다(`ui/select.tsx`의 `toSelectValue`/`fromSelectValue` 사용). 숫자 value는 `String(id)`↔`Number(val)` 왕복.
- 픽커/컨트롤 교체 시 **전송 payload 문자열 포맷을 그대로 보존**하라(예: DatePicker=`yyyy-MM-dd`, DateTimePicker=`yyyy-MM-ddTHH:mm`) — 폼 state·제출 로직·백엔드 경계를 안 바꾸는 drop-in이어야 한다.

## 인터랙티브 컨트롤 (드래그·리사이즈·스냅) 규칙 (실전 패턴 기반)

Radix로 안 덮이는 커스텀 상호작용(포인터 드래그, 크기 조절, 접힘 스냅 등)을 만들 때의 관례다. 이 부류도 위 Radix 규칙과 같이 **빌드·타입으로는 안 잡히고 실제로 끌어봐야** 검증된다. (실제 사례: LNB 너비 드래그 리사이저 + 200/150px 접힘 스냅.)

- **포인터 드래그는 `window` 리스너 + 정리로 구현하라.** `onPointerDown`에서 `window.addEventListener('pointermove'/'pointerup')`를 걸고, `pointerup`에서 **반드시 둘 다 remove**한다(누수·유령 드래그 방지). 드래그 값은 항상 **클램프**한다(`Math.min(MAX, Math.max(MIN, x))`) — 경계 없는 리사이즈는 레이아웃을 깨뜨린다.
- **동적 레이아웃 치수는 CSS 커스텀 프로퍼티 하나를 단일 소스로 삼아라.** 컨테이너에 인라인 `style={{ '--x': ... } as CSSProperties}`로 주입하고, 그리드·`position:fixed` 오버레이·핸들이 모두 `var(--x)`를 참조하게 하면 값 하나로 동기화된다(엘리먼트마다 좌표를 따로 계산하면 어긋난다). TS는 커스텀 프로퍼티를 모르므로 `as CSSProperties` 캐스트가 필요하다.
- **드래그 중 transition은 끄고, 이산(discrete) 스냅 순간에만 켜라.** 연속 추적에 CSS `transition`이 걸려 있으면 커서보다 뒤처져 끈적하게 느껴진다 → 드래그 중 `transition: none`. 반대로 접힘↔펼침처럼 **값이 튀는 스냅**은 애니메이션이 있어야 부드럽다 → 경계를 넘는 순간에만 짧게 transition을 복원하는 별도 플래그(예: `snapping` 200ms)를 두고, CSS 우선순위(같은 특이도면 뒤에 정의된 규칙이 이김)로 `resizing`(none)을 덮는다. 이 둘은 상충하는 요구라 상태를 분리해야 한다.
- **UI 지속 상태(너비·접힘·레이아웃)는 localStorage에 저장하라.** 기존 대시보드 패턴(`readStoredLayout`/`writeStoredLayout`)과 동일하게, 읽을 때 **범위·유효성 검증 후 기본값 폴백**, 쓸 때 `try/catch`(사용 불가 환경 무시). 새로고침 후에도 사용자의 조정이 유지되어야 한다.
- **완료 보고 전 실제로 끌어보고 확인하라.** 최소·최대 클램프, 경계 스냅 왕복(접힘→드래그로 복귀), 새로고침 후 복원까지 `npm run dev`로 눈으로 검증한 뒤 보고한다.

## 실행 / 검증

- 개발 서버: `cd frontend && npm run dev` (기본 `http://localhost:5173`)`.
- 빌드/타입체크: `npm run build`. 완료 보고 전 반드시 통과를 확인한다.
- 상호작용 변경(특히 Radix/asChild): 렌더/상호작용 테스트로 클릭 경로를 검증한 뒤 보고한다(빌드 통과 ≠ 동작).
