# CLAUDE.md

## 하네스: ReleaseTrack Dashboard 풀스택 개발

**목표:** Spring Boot 백엔드와 React/TS 프론트엔드의 기능을 백엔드↔프론트엔드 경계 정합성까지 맞춰 에이전트 팀으로 구현·QA·리뷰한다.

**트리거:** ReleaseTrack Dashboard의 풀스택 기능 개발, 코드 리뷰, 통합 QA/검증 요청 시 `fullstack-feature` 스킬(오케스트레이터)을 사용하라. 단순 단일 파일 질문·설명은 직접 응답 가능.

**팀 구성:** analyst(요구분석·경계계약) → backend-engineer(Spring Boot) + frontend-engineer(React/TS) → integration-qa(경계면 교차검증) → code-reviewer(품질 리뷰). 에이전트 정의는 `.claude/agents/`, 스킬은 `.claude/skills/`에서 관리한다.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 |
|------|----------|------|
| 2026-06-29 | 하네스 초기 구성 (에이전트 5 + 스킬 5) + 드라이런 검증 | 전체 |
| 2026-06-29 | 대시보드 전체 감사·보완 (N+1/페이지네이션/예외핸들러/검증/테스트) | backend/frontend |
| 2026-06-29 | Top5 카드, 배포 추이 서비스별 막대그래프화 | backend/frontend |
| 2026-06-29 | 배포 전략 모델 반영 (status 5종 마이그레이션, 파이프라인 카드) | backend/frontend |
| 2026-06-30 | 대시보드 설계 보완 + 개인화 (블럭 표시/순서 localStorage) | backend/frontend |
| 2026-06-30 | 라이트 테마 구현 (KPI 통합, 누적막대, 도넛) | backend/frontend |
| 2026-06-30 | QA에 Radix asChild 死클릭 패턴 반영 | skills/integration-qa |
| 2026-07-01 | 인터랙티브 컨트롤(드래그 리사이즈 등) 재사용 패턴 축적 | skills/frontend-development |
| 2026-07-01 | Service 소프트삭제(아카이브), 수정 항목 정리(name·owner 제거) | backend/frontend |
| 2026-07-01 | 시드 데이터 정합성 재설계+확장 (서비스 12, 배포 36) | backend |
| 2026-07-01 | UI 보정 다수 | frontend |
