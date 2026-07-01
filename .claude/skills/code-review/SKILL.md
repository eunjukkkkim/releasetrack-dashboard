---
name: code-review
description: ReleaseTrack Dashboard의 변경된 백엔드(Spring Boot)·프론트엔드(React/TS) 코드를 버그·컨벤션 일관성·SOLID·성능·가독성 관점에서 심각도 등급으로 리뷰하는 규약. 구현 완료 후 품질 검수, 코드 리뷰, 결함 탐지, 개선 제안이 필요할 때 반드시 사용한다. 풀스택 변경의 품질 리뷰 작업에 적용.
---

# Code Review — 품질 리뷰 규약

ReleaseTrack Dashboard의 변경 코드를 검토하여 결함과 개선점을 **심각도 등급 + 근거 + 대안**으로 제시하는 방법. 수정하지 않고 제안한다.

## 심각도 기준

| 등급 | 정의 | 예 |
|------|------|-----|
| CRITICAL | 데이터 손상·보안·크래시 | 트랜잭션 누락으로 부분 저장, SQL 인젝션, NPE 확실 |
| HIGH | 기능 오작동 | 잘못된 상태 코드, 검증 누락, 잘못된 쿼리 결과 |
| MEDIUM | 엣지케이스·유지보수성 | null 미처리 분기, 중복 로직, 약한 네이밍으로 오용 유발 |
| LOW | 스타일·사소 | 포맷, 주석, 미세 가독성 |

## 리뷰 축

### 1. 정확성 (최우선)
- 논리 버그, off-by-one, 잘못된 조건.
- **null 처리**: nullable 필드(`lastDeployedAt`, `failureReason`, `daysSinceLastDeployment` 등)를 안전하게 다루는가.
- 엣지케이스: 빈 목록, 미배포 서비스, 0건 집계(대시보드 successRate 분모 0), 동시 수정.

### 2. 컨벤션 일관성
- 백엔드: 생성자 주입, DTO 변환(Entity 직접 노출 금지), `@Valid` 검증, `ResourceNotFoundException` 사용, 응답 정책(200/201/204/400/404).
- 프론트: 타입은 `types.ts`에, 패칭은 api→query→화면 계층, `getErrorMessage` 사용, 상태 컴포넌트 재사용, 로컬 UI primitive 사용.
- 새 코드가 동일 도메인 기존 코드와 구분되지 않는가.

### 3. SOLID / 설계
- Controller에 비즈니스 로직이 새지 않았는가(SRP).
- 책임 분리, 과도한 결합, 재사용 가능한 로직의 중복.

### 4. 성능
- 백엔드: **N+1 쿼리**(연관 엔티티 반복 조회 — fetch join/`@EntityGraph` 권장), 불필요한 전체 조회 후 메모리 필터, 인덱스 활용(`schema.sql`).
- 프론트: 불필요한 refetch/리렌더, 쿼리 키 설계, 큰 목록 렌더.

### 5. 가독성·네이밍
- 의도가 드러나는 이름, 매직 넘버, 죽은 코드.

## 작업 방식

1. 검토 대상 식별: `_workspace/02_backend_done.md`·`_workspace/03_frontend_done.md`가 가리키는 파일, 또는 최근 변경 파일.
2. 각 파일을 기존 동일 도메인 코드와 비교하며 위 5축으로 검토.
3. 발견을 심각도순으로 정렬, 각 항목에 **파일:라인 + 문제 + 근거 + 제안**을 단다.
4. `_workspace/05_review.md`에 기록(에이전트 정의의 출력 템플릿 사용).

## shadcn/Radix 상호작용 점검 (필수 — 빌드 통과해도 죽는 버그)

프론트 변경에 shadcn/Radix 상호작용 컴포넌트가 있으면 반드시 확인한다(빌드·타입·순수테스트로 안 잡히는 부류):
- **`asChild`/Slot로 감싼 커스텀 자식이 `{...rest}`를 DOM 노드에 spread하는가.** 누락 시 Radix 주입 핸들러(onClick/onPointerDown/data-state/aria-expanded)가 도달 못 해 **클릭 무반응**. forwardRef + rest spread 둘 다 필요. (실제 사례: DatePicker 트리거 무반응.)
- **상호작용 컴포넌트(Popover/Dialog/Select 등)에 렌더/상호작용 테스트가 있는가.** 없으면 "테스트 커버리지 공백 + 회귀 위험"으로 지적한다(순수함수 테스트만으로는 클릭 경로 미검증).
- Radix Select `value=""` 금지 → sentinel 처리·환원 정확성, payload 포맷 보존(drop-in) 여부.

## 원칙

- **근거 없는 지적 금지.** 왜 문제인지, 어떻게 고치는지 함께 댄다. LLM이든 사람이든 이유를 알아야 올바로 고친다.
- **integration-qa와 분업.** 경계면 정합성(타입 불일치 등)은 QA 담당. 리뷰어는 각 계층 내부의 로직·설계·성능에 집중한다. 중복 보고하지 않는다.
- **잘된 점도 적는다.** 무엇을 유지해야 하는지 알려 회귀를 막는다.
- 일반론보다 이 프로젝트의 컨벤션을 기준으로 본다.
