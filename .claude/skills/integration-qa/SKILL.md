---
name: integration-qa
description: ReleaseTrack Dashboard의 백엔드↔프론트엔드 경계면 정합성을 교차 검증하는 QA 규약. API 응답 DTO shape과 프론트 TS 타입·쿼리 소비 코드를 대조하여 필드명·타입·nullable·enum 불일치를 찾을 때, 또는 빌드/테스트/실제 API 호출로 통합을 검증할 때 반드시 사용한다. 풀스택 변경의 정합성 검증·QA·통합 점검 작업에 적용.
---

# Integration QA — 경계면 교차 검증 규약

ReleaseTrack Dashboard에서 백엔드와 프론트엔드가 **실제로 맞물리는지** 검증하는 방법. 핵심 통찰: 각 계층은 단독으로는 컴파일·통과하지만 경계에서 어긋난다. "존재 확인"이 아니라 "경계면 교차 비교"가 QA의 본질이다.

## 왜 경계면인가

백엔드 테스트가 통과하고 프론트 빌드가 통과해도, 응답 shape과 소비 타입이 다르면 런타임에 깨진다. 두 계층을 따로 보면 이 버그는 절대 안 보인다. 반드시 **API 응답과 프론트 소비 코드를 짝지어 동시에 읽어야** 드러난다.

## 경계면 버그 패턴 (이 프로젝트에서 빈발)

1. **nullable 불일치** — 백엔드는 null을 보내는데 프론트 타입은 non-null. 예: `daysSinceLastDeployment`가 미배포 서비스에서 `null`인데 프론트가 `number`로 받아 `.toFixed()` 등에서 크래시.
2. **필드명 불일치** — 백엔드 `serviceName` vs 프론트 `name`. 직렬화 후에야 드러남.
3. **enum/union 값 누락** — 백엔드에 `IN_PROGRESS` 추가했는데 프론트 union에 없어 타입 좁히기/표시가 깨짐.
4. **필드 존재 불일치** — 한쪽에만 있는 필드(백엔드가 안 보내는데 프론트가 읽음 → undefined).
5. **타입 형태 불일치** — 배열 vs 단일, 중첩 객체 구조 차이(예: `changes: DeploymentChangeResponse[]`).
6. **상태 코드/에러 형태 불일치** — 백엔드 `ErrorResponse.fieldErrors` 구조와 프론트 `getErrorMessage`의 기대가 다름.
7. **런타임 상호작용 死(dead) 경로** — 타입·shape은 맞는데 사용자 동작이 죽는 부류. 대표: shadcn/Radix `asChild`/Slot 커스텀 트리거가 `{...rest}`(주입된 onClick/onPointerDown/data-state/aria-expanded)를 DOM 노드에 전달하지 않아 **클릭해도 팝오버/다이얼로그/셀렉트가 안 열림**. 이 결함은 `./gradlew test`·`npm run build`·타입체크·순수함수 단위테스트를 **전부 통과한다** — "빌드 통과 ≠ 동작"의 대표 사례라 QA가 잡아야 한다. (실제 사례: DatePicker 트리거가 rest 미전달로 무반응.)

## 검증 방법 (점진적 + 교차)

**점진적**: 전체 완성을 기다리지 않는다. 백엔드 모듈이 끝나면 그 응답 DTO를, 프론트가 끝나면 그 소비 코드를 즉시 검증한다.

**교차 비교 절차** (엔드포인트/DTO 단위로):
1. 백엔드 Response DTO 파일을 읽어 필드명·Java 타입·nullable을 표로 만든다.
2. 프론트 `src/api/types.ts`의 대응 타입을 읽어 같은 표로 만든다.
3. 추가로 그 타입을 **소비하는 코드**(queries/pages)를 읽어, 실제로 어떻게 접근하는지(`.map`, `.toFixed`, 옵셔널 체이닝 유무) 확인한다.
4. 두 표를 필드별로 대조하여 위 6개 패턴에 해당하는 불일치를 찾는다.

**실행 검증**:
- 백엔드: `cd backend && ./gradlew test`
- 프론트: `cd frontend && npm run build` (타입 체크 포함)
- 실제 응답 확인이 필요하면: 백엔드 기동 후 `curl http://localhost:8080/api/...`로 실제 JSON shape을 받아 타입과 대조. (기동은 `run_in_background` 활용)
- **상호작용 死경로 검증(패턴 7)**: 변경분에 shadcn/Radix 상호작용 컴포넌트(Popover/Dialog/Select/Tooltip, `asChild` 트리거 포함)가 있으면 빌드 통과만으로 끝내지 않는다. (a) 커스텀 트리거가 `forwardRef` + `{...rest}` spread를 둘 다 갖췄는지 코드로 확인하고, (b) 해당 컴포넌트의 렌더/상호작용 테스트(`npm run test` 또는 `npx vitest run`)를 실제로 돌려 트리거 클릭→열림이 검증되는지 확인한다. 테스트가 없으면 "상호작용 미검증(회귀 위험)"으로 보고한다 — 존재 여부 지적은 code-review와 분업이되, QA는 **실행하여 클릭 경로가 살아있음을 확인**하는 것이 역할이다.

## 검증 체크리스트

엔드포인트별로 확인:
- [ ] 모든 응답 필드명이 프론트 타입과 일치
- [ ] nullable 필드가 양쪽 모두 `| null` / `Optional`/null 가능으로 일치
- [ ] enum/union 값 집합이 양쪽 동일
- [ ] 숫자/날짜/불리언 타입이 일치 (날짜는 string)
- [ ] 중첩/배열 구조 일치
- [ ] 에러 응답 형태가 `getErrorMessage` 기대와 일치
- [ ] backend `./gradlew test` 통과
- [ ] frontend `npm run build` 통과
- [ ] (Radix/asChild 변경 시) 커스텀 트리거가 `forwardRef` + `{...rest}` spread 보유
- [ ] (Radix/asChild 변경 시) 렌더/상호작용 테스트가 존재하고 통과 — 클릭→열림 경로 실증(빌드 통과만으로 불충분)

## 보고 원칙

- **재현 가능한 증거**: 파일·필드·시나리오를 명시한다. "타입 안 맞음"(X) → "`StaleServiceResponse.daysSinceLastDeployment`: 백엔드 nullable `Long`, 프론트 `number` non-null. 미배포 서비스 응답에서 `null` 수신 시 표시 로직 크래시"(O).
- **심각도순 정렬**: HIGH(런타임 크래시/데이터 깨짐) → MEDIUM(엣지케이스) → LOW.
- **미검증 항목 명시**: 실행하지 못한 검증은 "미검증"으로 표시한다. 검증한 척하지 않는다.
- 결과는 `_workspace/04_qa_report.md`에 기록한다(에이전트 정의의 출력 템플릿 사용).
