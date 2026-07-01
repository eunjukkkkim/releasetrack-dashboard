---
name: fullstack-feature
description: ReleaseTrack Dashboard의 풀스택 기능을 에이전트 팀으로 끝까지 구현하는 오케스트레이터. 새 API+화면 기능 개발, 기존 기능 수정/보완, 코드 리뷰, 통합 QA/검증을 백엔드↔프론트엔드 경계 정합성까지 맞춰 처리한다. "기능 추가/구현/개발", "API와 화면 만들어줘", "대시보드에 ~ 추가", "리뷰해줘", "통합 검증/QA", "다시 실행/재실행/수정/보완/개선", "{도메인}의 {부분}만 다시" 등 ReleaseTrack 개발·리뷰·검증 요청 시 반드시 사용한다. 단순 단일 파일 질문은 직접 응답 가능.
---

# Fullstack Feature — 오케스트레이터

ReleaseTrack Dashboard의 풀스택 작업을 **에이전트 팀**으로 조율한다. 팀원: analyst, backend-engineer, frontend-engineer, integration-qa, code-reviewer. 모든 Agent 호출에 `model: "opus"`를 명시한다.

**실행 모드:** 에이전트 팀 (기본). 팀원은 SendMessage로 직접 통신하고, `_workspace/` 파일로 산출물을 주고받는다.

## Phase 0: 컨텍스트 확인 (항상 먼저)

1. `_workspace/` 존재 여부와 내용을 확인한다.
2. 실행 모드를 판별한다:
   - `_workspace/` 없음 → **초기 실행** (전체 워크플로우)
   - `_workspace/` 있음 + 사용자가 부분 수정/특정 부분 재실행 요청 → **부분 재실행** (해당 에이전트만 재호출, 나머지 산출물 재사용)
   - `_workspace/` 있음 + 새 기능 입력 → **새 실행** (기존 `_workspace/`를 `_workspace_prev/`로 이동 후 초기 실행)
3. 작업 규모를 가늠하여 어떤 에이전트가 필요한지 결정한다(아래 라우팅).

## 라우팅 (요청 유형별 필요 팀원)

| 요청 | 필요 팀원 |
|------|----------|
| 풀스택 신규 기능 | analyst → backend-engineer + frontend-engineer → integration-qa → code-reviewer |
| 백엔드만 | analyst(경계 확정) → backend-engineer → integration-qa → code-reviewer |
| 프론트만 | analyst(경계 확정) → frontend-engineer → integration-qa → code-reviewer |
| 코드 리뷰만 | code-reviewer |
| 통합 QA만 | integration-qa |
| 버그 수정 | (영향 계층 엔지니어) → integration-qa |

리뷰/QA 단독 요청은 팀 없이 해당 에이전트 1명만 호출해도 된다.

## 워크플로우 (초기 실행, 풀스택 신규 기능 기준)

**팀 크기:** 작업 규모에 맞춰 2~5명. 소규모는 analyst를 생략하고 엔지니어가 직접 계약을 정해도 된다.

### Phase 1: 분석 (analyst)
- `TeamCreate`로 팀을 만들거나, 먼저 analyst를 호출해 경계 계약을 확정한다.
- 산출물: `_workspace/01_analyst_contract.md`.

### Phase 2: 병렬 구현 (backend-engineer + frontend-engineer)
- 두 엔지니어가 경계 계약을 공유받아 **병렬로** 구현한다.
- 프론트는 백엔드 미완 시 계약 shape 기준으로 선행 구현 후, 백엔드 완료 시 실제 shape과 대조.
- 산출물: `_workspace/02_backend_done.md`, `_workspace/03_frontend_done.md`.

### Phase 3: 통합 QA (integration-qa) — 점진적
- 각 엔지니어 완료 직후 즉시 경계면을 교차 검증한다(전체 완성 대기 금지).
- 불일치 발견 시 해당 엔지니어에게 SendMessage → 수정 → 재검증 루프.
- 산출물: `_workspace/04_qa_report.md`. 판정이 "통과"가 될 때까지 반복.

### Phase 4: 코드 리뷰 (code-reviewer)
- QA 통과 후 각 계층 내부 품질을 리뷰.
- HIGH 이상은 엔지니어에게 전달 → 수정.
- 산출물: `_workspace/05_review.md`.

### Phase 5: 종합 보고
- 리더가 `_workspace/`의 산출물을 종합하여 사용자에게 보고: 구현 내용, QA 판정, 리뷰 요약, 남은 권고사항.
- 팀 정리(`TeamDelete`). `_workspace/`는 보존(감사 추적용).

## 데이터 전달 프로토콜

- **태스크 기반**: `TaskCreate`로 작업과 의존성(분석→구현→QA→리뷰) 등록, `TaskUpdate`로 상태 추적.
- **파일 기반**: `_workspace/{phase}_{agent}_{artifact}.md` 컨벤션으로 산출물 저장. 최종 코드만 실제 소스 경로에 출력.
- **메시지 기반**: 경계 변경·불일치·질의는 SendMessage로 실시간 전달. 경계 변경은 백엔드·프론트 양쪽 동시 통지.

## 에러 핸들링

- 에이전트 작업 실패: 1회 재시도. 재실패 시 해당 산출물 없이 진행하되 최종 보고에 **누락을 명시**한다.
- 빌드/테스트 실패: 담당 엔지니어가 자체 1회 수정. 그래도 실패면 실패 로그를 산출물에 남기고 리더에게 보고 — 실패를 숨기고 완료 보고 금지.
- 경계 계약 충돌: analyst가 충돌을 명시하고 사용자/리더에게 결정 요청. 임의로 한쪽만 바꾸지 않는다.
- 상충 데이터: 삭제하지 않고 출처를 병기한다.

## 후속 작업 (부분 재실행)

사용자가 "백엔드만 다시", "이 화면만 수정", "리뷰 반영해서 개선" 등을 요청하면:
1. `_workspace/`의 기존 산출물을 읽는다.
2. 해당 에이전트만 재호출하며, 기존 산출물 + 사용자 피드백을 입력으로 준다.
3. 변경이 경계에 영향을 주면 integration-qa를 다시 돌려 회귀를 확인한다.

## 테스트 시나리오

**정상 흐름:** "대시보드에 '환경별 평균 배포 소요시간' 카드를 추가해줘"
→ Phase 0: `_workspace/` 없음 → 초기 실행
→ analyst: `GET /api/dashboard/summary`에 `avgDeployDurationByEnv: Array<{environment, avgMinutes: number|null}>` 추가 계약 작성
→ backend: DashboardService 집계 + DTO 추가 + 테스트, frontend: 타입 추가 + 카드 컴포넌트 (병렬)
→ integration-qa: `avgMinutes` nullable 일치 확인, 빌드/테스트 통과 확인
→ code-reviewer: 집계 쿼리 N+1 여부, 0건 분모 처리 검토
→ 종합 보고.

**에러 흐름:** 프론트 타입이 백엔드 nullable을 누락(`avgMinutes: number`)
→ integration-qa가 nullable 불일치(HIGH) 발견 → frontend-engineer에게 SendMessage
→ frontend가 `number | null`로 수정 → integration-qa 재검증 → 통과 → 진행.
