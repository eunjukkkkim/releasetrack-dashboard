# ReleaseTrack Dashboard Frontend

React + TypeScript로 구현한 서비스 배포 현황 대시보드입니다. 백엔드 REST API를 호출해 서비스, 배포 이력, 대시보드 요약을 표시합니다.

## 관련 문서

- [프로젝트 README](../README.md)
- [Backend README](../backend/README.md)

## 기술 스택

- React 18 + TypeScript 5, Vite 5
- react-router-dom 6 (라우팅)
- TanStack Query 5 (서버 상태), Axios (HTTP)
- Recharts (차트), lucide-react (아이콘), sonner (토스트)
- Radix UI + class-variance-authority + clsx + tailwind-merge (shadcn 스타일 로컬 UI)
- Tailwind CSS v4 (`@tailwindcss/vite` 플러그인, hybrid 구성)
- date-fns + react-day-picker (날짜 입력)
- Vitest + Testing Library (테스트)

## 로컬 실행

Node.js 24 LTS와 npm 11을 권장합니다(검증: Node `v24.18.0`, npm `11.16.0`). 프로젝트 루트의 `.nvmrc`로 버전을 맞출 수 있습니다.

```bash
nvm use
```

```bash
cd frontend
npm install
npm run dev
```

프론트엔드는 항상 5173 포트로 실행하며, 별도 설정 없이 백엔드 `http://localhost:8080`에 연결합니다.

```text
http://localhost:5173
```

API 주소는 `src/api/client.ts`에서 `import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'`로 결정됩니다. 다른 주소가 필요하면 `.env.local`을 만들고 `VITE_API_BASE_URL`을 지정합니다. 현재 프로젝트에서는 기본 주소를 사용하므로 별도의 env 파일이 없습니다.

## 스크립트

```bash
npm run dev      # 개발 서버 (5173)
npm run build    # 타입 검사(tsc -b) + 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
npm run test     # Vitest 실행 (vitest run)
```

## 구현 화면

| 화면              | 경로                          |
| ----------------- | ----------------------------- |
| Dashboard Home    | `/`                           |
| Service List      | `/services`                   |
| Service Detail    | `/services/{serviceId}`       |
| Deployment List   | `/deployments`                |
| Deployment Create | `/deployments/create`         |
| Deployment Detail | `/deployments/{deploymentId}` |

잘못된 경로나 숫자가 아닌 id는 목록/홈으로 리다이렉트합니다.

## Dashboard Home 구성

`DashboardHome`은 데이터 조회와 블록 배치(표시/순서 개인화)만 담당하는 셸이고, 각 블록은 별도 컴포넌트로 분리되어 있습니다.

- KPI 행: 전체/활성 서비스, 최근 7일 배포, Production 배포, 성공/실패/롤백, 배포 성공률
- 환경 파이프라인 현황(`PipelineCard`): 서비스 선택 → DEV/STAGING/PRODUCTION 최신 배포
- 최근 7일 배포 추이(`TrendCard`, 상태별 누적 막대), 상태별 배포 분포(`StatusDistCard`, 환경 셀렉터 + 도넛)
- 최근 실패 배포 / 서비스별 마지막 배포 상태(경과일 포함) / 최근 배포 이력 테이블
- 서비스별 배포 횟수 Top 5(기본 숨김, 설정에서 표시)
- `DashboardSettings` 다이얼로그에서 블록 표시 여부·순서를 편집하며, 레이아웃은 localStorage에 저장됩니다.

운영 주의(실패/롤백) 알림은 상단에 노출되며 닫으면 해당 상태가 localStorage에 기억됩니다.

## 디렉토리 구조

```text
src
├── api          # axios client + REST 함수 + 공유 타입
├── queries      # TanStack Query hook / query key
├── hooks        # 공용 hook
├── lib          # 유틸(cn, storage, pagination)
├── constants    # enum → Select 옵션 매핑
├── components   # ui(shadcn 프리미티브) + 공용 컴포넌트
├── pages        # dashboard / services / deployments
├── styles       # 커스텀 CSS
├── index.css    # Tailwind v4 엔트리 + 디자인 토큰
└── main.tsx     # 앱 진입점(Provider + Router)
```

## 데이터 패칭 패턴

- 서버 상태는 전부 TanStack Query로 관리합니다(`QueryClient` 기본 `retry: 1`, `staleTime: 20s`).
- 도메인별 query key 팩토리(`serviceKeys`/`deploymentKeys`/`dashboardKeys`)로 캐시 키를 계층화합니다.
- 뮤테이션 성공 시 관련 캐시를 무효화합니다. 배포 변경은 deployments + services + dashboard를 함께 무효화해 교차 의존을 반영합니다.
- 목록 화면의 필터·페이지 상태는 `useUrlListState`로 URL 쿼리에 커밋해 뒤로가기/공유 시 복원됩니다.
- `src/api/*.ts`는 순수 axios 호출 계층이고, 에러 메시지는 `getErrorMessage()`로 통일합니다.

## 스타일

- Atlassian 계열 디자인 시스템(액션색 `#1868db`, 다크 사이드바 + 라이트 콘텐츠)을 반영했습니다. 참조: `docs/DESIGN.md`.
- Tailwind v4는 **hybrid** 구성입니다: `theme`/`utilities` 레이어만 쓰고 preflight는 제외해 기존 `.rt-*` 커스텀 CSS(`styles/`)를 보존합니다.
- 화면 대부분은 커스텀 CSS, Tailwind 유틸리티는 주로 `components/ui`에서 사용합니다.

## 백엔드 연동 타입

실제 타입은 `src/api/types.ts`에 정의되어 있으며 백엔드 enum과 일치합니다.

```ts
type ServiceStatus = "ACTIVE" | "ARCHIVED" | "MAINTENANCE";
type DeploymentEnvironment = "DEV" | "STAGING" | "PRODUCTION";
type DeploymentStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "ROLLED_BACK";
type ChangeType = "FEATURE" | "BUG_FIX" | "REFACTOR" | "CONFIG" | "ETC";
```

## 테스트

Vitest + Testing Library(jsdom) 기반이며, `src/test/setup.ts`에서 Radix/react-day-picker용 jsdom 폴리필을 등록합니다.

```bash
npm run test
```

## 참고

- 타입 빌드 산출물(`tsconfig` project references)은 소스 트리를 오염시키지 않도록 `node_modules/.tmp/`로 격리됩니다(`tsconfig*.json`의 `outDir`/`tsBuildInfoFile`).
