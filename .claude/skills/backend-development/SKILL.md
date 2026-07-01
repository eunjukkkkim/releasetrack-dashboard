---
name: backend-development
description: ReleaseTrack Dashboard의 Spring Boot 백엔드(Java 17, Spring Boot 3.3, Spring Data JPA, H2, Jakarta Validation) 구현 규약. domain 계층에 Entity/Repository/Service/Controller/DTO를 추가·수정하거나, MockMvc 통합 테스트를 작성하거나, 새 API 엔드포인트를 만들 때 반드시 사용한다. backend/ 디렉토리의 Java 코드를 다루는 모든 작업에 적용.
---

# Backend Development — Spring Boot 도메인 구현 규약

ReleaseTrack Dashboard 백엔드(`backend/`)의 코드를 작성·수정할 때 따르는 규약. 목표는 **기존 코드와 구분되지 않는 코드**를 작성하는 것이다.

## 기술 스택

- Java 17, Spring Boot 3.3.x, Gradle
- Spring Web, Spring Data JPA, H2(인메모리 `jdbc:h2:mem:releasetracker`)
- Jakarta Bean Validation

## 패키지 구조 (domain 중심)

```
com.example.releasetracker
├── domain
│   ├── service      # ManagedService Entity/Repo/Service/Controller + dto/
│   ├── deployment   # Deployment, DeploymentChange + enums + dto/
│   └── dashboard    # 집계 전용 (Controller/Service + dto/)
└── global
    ├── config       # WebConfig (CORS)
    └── exception    # GlobalExceptionHandler, ErrorResponse, ResourceNotFoundException
```

새 기능은 해당 도메인 패키지 안에 둔다. 도메인을 가로지르는 집계는 `dashboard`에 둔다.

## 계층 규칙

| 계층 | 책임 | 규칙 |
|------|------|------|
| Controller | HTTP 매핑, 검증, 상태 코드 | 비즈니스 로직 금지. `@Valid`로 요청 검증. Service 호출 후 DTO 반환 |
| Service | 비즈니스 로직, 트랜잭션 | `@Transactional`. Entity↔DTO 변환의 책임 위치. Repository 호출 |
| Repository | 데이터 접근 | `JpaRepository` 확장. 쿼리 메서드 또는 `@Query` |
| Entity | 영속 모델 | **절대 API로 직접 노출 금지** |
| DTO | API 경계 | 요청은 `*Request`, 응답은 `*Response` |

## 필수 컨벤션

1. **의존성 주입**: 생성자 주입을 사용한다(필드 `@Autowired` 금지). 기존 Service/Controller의 패턴을 그대로 따른다.
2. **DTO 변환**: Entity를 응답으로 직접 내보내지 않는다. Response DTO로 변환한다. 기존 DTO의 static factory 메서드(예: `from(entity)`) 패턴을 확인하고 모방한다.
3. **검증**: 요청 DTO에 Jakarta Validation 애너테이션(`@NotNull`, `@NotBlank` 등)을 단다. 검증 실패는 `GlobalExceptionHandler`가 400 + `fieldErrors`로 변환한다.
4. **예외**: 리소스 없음은 `ResourceNotFoundException`을 던진다(→ 404). 새 예외 타입이 필요하면 `global/exception`에 추가하고 핸들러에 매핑한다.
5. **enum**: 상태/환경/변경유형은 enum(`ServiceStatus`, `DeploymentStatus`, `DeploymentEnvironment`, `ChangeType`)으로 관리한다. 프론트 TS union 타입과 값이 정확히 일치해야 한다.

## 응답 정책 (반드시 준수)

| 상황 | 코드 |
|------|------|
| 조회/수정 성공 | 200 OK |
| 생성 성공 | 201 Created |
| 삭제 성공 | 204 No Content |
| 검증 실패 | 400 Bad Request (+ fieldErrors) |
| 리소스 없음 | 404 Not Found |

## 경계 계약 준수 (가장 중요)

이 프로젝트의 가장 흔한 버그는 백엔드 응답 shape과 프론트 타입의 불일치다. 따라서:

- 응답 DTO의 **필드명**은 프론트 `types.ts`와 정확히 일치(camelCase).
- **nullable**을 명확히 한다. DB/로직상 null이 가능한 필드(예: `lastDeployedAt`, `daysSinceLastDeployment`, `failureReason`)는 프론트에서 `| null`로 받는다 — 계약에 반드시 명시.
- 숫자 타입: Java `Long`/`Integer`/`double`은 프론트에서 모두 `number`. 단 nullable 여부가 일치해야 한다.
- 날짜는 ISO-8601 문자열(`LocalDateTime` 직렬화)로 내보내고 프론트는 `string`으로 받는다.

## 테스트

- 통합 테스트는 MockMvc 기반 `src/test/java/.../ApiIntegrationTests.java`에 작성한다.
- 새 엔드포인트마다 정상 흐름 1개 + 검증 실패 또는 404 흐름 1개 이상을 추가한다.
- 검증: `cd backend && ./gradlew test`. 빌드가 길면 `run_in_background`로 실행하고 결과를 확인한다.

## 작업 순서 (새 엔드포인트 추가 시)

1. 경계 계약(`_workspace/01_analyst_contract.md`) 확인 — 경로·요청/응답 shape.
2. 동일 도메인의 기존 파일을 읽어 패턴 파악.
3. DTO(Request/Response) → Repository 쿼리(필요 시) → Service 로직 → Controller 매핑 순으로 구현.
4. MockMvc 테스트 작성.
5. `./gradlew test` 통과 확인.
6. `_workspace/02_backend_done.md`에 실제 응답 shape과 테스트 결과 기록.
