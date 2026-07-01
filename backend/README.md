# ReleaseTrack Dashboard Backend

서비스 배포 이력을 관리하는 Spring Boot REST API입니다. 서비스/배포 CRUD와 대시보드 집계 API를 제공합니다.

## 관련 문서

- [프로젝트 README](../README.md)
- [Frontend README](../frontend/README.md)

## 기술 스택

- Java 17 (Gradle toolchain)
- Spring Boot 3.3.13 (Web, Data JPA, Validation)
- Gradle 8.10.2 (wrapper)
- H2 Database (in-memory)
- Jakarta Bean Validation
- 테스트: Spring Boot Test, MockMvc

## 프로젝트 구조

도메인별 패키지 안에 Entity/Repository/Service/Controller/DTO를 함께 두는 구성입니다.

```text
src/main/java/com/example/releasetracker
├── domain
│   ├── service      # 서비스 CRUD
│   ├── deployment   # 배포 이력 CRUD
│   └── dashboard    # 집계 API
└── global           # config(CORS) / dto / exception 공통

src/main/resources   # application.yml, schema.sql(인덱스), data.sql(샘플)
src/test/java        # MockMvc 통합 테스트
```

## 도메인 모델

| 테이블               | 엔티티           | 핵심 필드                                                                                                                                       |
| -------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `services`           | ManagedService   | name, description, owner, repositoryUrl, status, createdAt, updatedAt                                                                           |
| `deployments`        | Deployment       | service_id, version, environment, status, deployedBy, deployedAt, startedAt, finishedAt, commit_sha, branch, summary, failureReason, rollbacked |
| `deployment_changes` | DeploymentChange | deployment_id, changeType, description, createdAt                                                                                               |

enum 값:

- `ServiceStatus`: `ACTIVE`, `ARCHIVED`, `MAINTENANCE`
- `DeploymentEnvironment`: `DEV`, `STAGING`, `PRODUCTION`
- `DeploymentStatus`: `QUEUED`, `RUNNING`, `SUCCESS`, `FAILED`, `ROLLED_BACK`
- `ChangeType`: `FEATURE`, `BUG_FIX`, `REFACTOR`, `CONFIG`, `ETC`

## 구현 API

| Method | Path                                     | 설명                                                                                                                             |
| ------ | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/services`                          | 서비스 목록. 쿼리 `status`, `keyword`(이름 부분검색)                                                                             |
| POST   | `/api/services`                          | 서비스 등록 (201 + Location)                                                                                                     |
| GET    | `/api/services/{serviceId}`              | 서비스 상세                                                                                                                      |
| PATCH  | `/api/services/{serviceId}`              | 서비스 수정 (부분 수정)                                                                                                          |
| DELETE | `/api/services/{serviceId}`              | 서비스 삭제 (204)                                                                                                                |
| GET    | `/api/deployments`                       | 배포 이력 목록(페이지네이션). 쿼리 `serviceId`, `environment`, `status`, `branch`, `from`, `to`, `page`(기본 0), `size`(기본 20) |
| POST   | `/api/deployments`                       | 배포 이력 등록 (201 + Location)                                                                                                  |
| GET    | `/api/deployments/{deploymentId}`        | 배포 이력 상세(변경사항 포함)                                                                                                    |
| PATCH  | `/api/deployments/{deploymentId}`        | 배포 이력 수정 (부분 수정)                                                                                                       |
| DELETE | `/api/deployments/{deploymentId}`        | 배포 이력 삭제 (204)                                                                                                             |
| GET    | `/api/dashboard/summary`                 | 대시보드 요약(KPI/추이/상태분포/최근·실패 배포/서비스 상태/Top5)                                                                 |
| GET    | `/api/dashboard/pipeline?serviceId={id}` | 특정 서비스의 DEV/STAGING/PRODUCTION 최신 배포 상태                                                                              |

- `/api/deployments` 목록은 `PageResponse<DeploymentListResponse>`(content, page, size, totalElements, totalPages, first, last)로 반환합니다.
- CORS는 `/api/**` 경로에 대해 `http://localhost:5173`(프론트) 오리진을 허용합니다.

## 응답 정책

- 조회/수정 성공: `200 OK`
- 생성 성공: `201 Created`
- 삭제 성공: `204 No Content`
- 요청값 검증 실패 / 잘못된 파라미터: `400 Bad Request`
- 리소스 없음: `404 Not Found`
- 처리하지 못한 오류: `500 Internal Server Error`

`@RestControllerAdvice`(GlobalExceptionHandler)에서 공통 `ErrorResponse`(status, error, message, fieldErrors?)로 변환합니다. 검증 실패는 필드별 메시지를 `fieldErrors`로 내려줍니다. Entity는 응답으로 직접 노출하지 않고 Response DTO로 변환합니다.

## 로컬 실행

Java 17 이상이 필요합니다. 백엔드는 항상 8080 포트로 실행합니다.

```bash
cd backend
./gradlew bootRun
```

실행 주소 (고정):

```text
http://localhost:8080
```

8080 포트가 이미 사용 중이면 점유 프로세스를 종료한 뒤 다시 실행합니다.

```bash
lsof -nP -iTCP:8080 -sTCP:LISTEN
kill <PID>
```

### IntelliJ IDEA 실행

1. IntelliJ에서 `backend` 폴더를 Gradle 프로젝트로 엽니다.
2. Project SDK를 Java 17 이상으로 설정합니다 (`File > Project Structure > Project`).
3. `src/main/java/com/example/releasetracker/ReleaseTrackerApplication.java`의 `main` 실행 버튼을 클릭합니다.
4. 콘솔에 `Tomcat started on port 8080`, `Started ReleaseTrackerApplication`이 보이면 정상입니다.

## H2 Console

H2 인메모리 DB를 사용하며, 기동 시 `schema.sql`(인덱스) → `data.sql`(샘플 데이터)가 자동 실행됩니다(`ddl-auto: create`, `defer-datasource-initialization: true`).

```text
http://localhost:8080/h2-console
```

접속 정보:

```text
JDBC URL: jdbc:h2:mem:releasetracker
User Name: sa
Password:
```

## 샘플 데이터

`data.sql` 기준으로 서비스 12건, 배포 이력 36건, 변경사항 40건이 시드됩니다. 배포 날짜는 실행 시점 기준 상대 시간(`current_timestamp`/`dateadd`)으로 생성되어, "최근 7일" 윈도우와 "오늘 진행 중(RUNNING/QUEUED)" 항목이 항상 성립합니다.

## 테스트

MockMvc 기반 API 통합 테스트(`ApiIntegrationTests`)와 컨텍스트 로드 테스트로 구성됩니다.

```bash
cd backend
./gradlew test
```

## API 호출 예시

서비스 목록 조회:

```bash
curl http://localhost:8080/api/services
```

서비스 등록:

```bash
curl -X POST http://localhost:8080/api/services \
  -H "Content-Type: application/json" \
  -d '{
    "name": "admin-web",
    "description": "관리자 웹 서비스",
    "owner": "frontend-team",
    "repositoryUrl": "https://github.com/example/admin-web",
    "status": "ACTIVE"
  }'
```

배포 이력 목록 조회(필터 + 페이지네이션):

```bash
curl "http://localhost:8080/api/deployments?environment=PRODUCTION&status=SUCCESS&page=0&size=20"
```

배포 이력 등록:

```bash
curl -X POST http://localhost:8080/api/deployments \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": 1,
    "version": "v1.2.5",
    "environment": "PRODUCTION",
    "status": "SUCCESS",
    "deployedBy": "mason",
    "deployedAt": "2026-07-01T15:00:00",
    "branch": "main",
    "summary": "주문 내역 화면 개선",
    "rollbacked": false,
    "changes": [
      { "changeType": "FEATURE", "description": "주문 내역 필터 기능 추가" },
      { "changeType": "BUG_FIX", "description": "상세 진입 시 로딩이 멈추던 문제 수정" }
    ]
  }'
```

대시보드 요약 조회:

```bash
curl http://localhost:8080/api/dashboard/summary
```

### Dashboard Summary 응답 형태

```json
{
  "totalServiceCount": 12,
  "activeServiceCount": 9,
  "weeklyDeploymentCount": 18,
  "productionDeploymentCount": 7,
  "successDeploymentCount": 10,
  "failedDeploymentCount": 2,
  "rollbackCount": 1,
  "successRate": 76.9,
  "deploymentTrendByStatus": {
    "series": ["SUCCESS", "FAILED", "RUNNING"],
    "points": [
      { "date": "2026-06-25", "SUCCESS": 1, "FAILED": 0, "RUNNING": 0 }
    ]
  },
  "statusStats": [{ "status": "SUCCESS", "count": 10 }],
  "statusStatsByEnvironment": [
    {
      "environment": "PRODUCTION",
      "statusStats": [{ "status": "SUCCESS", "count": 6 }]
    }
  ],
  "recentFailedDeployments": [],
  "serviceDeploymentStatuses": [
    {
      "serviceId": 1,
      "serviceName": "customer-web",
      "serviceStatus": "ACTIVE",
      "owner": "frontend-team",
      "lastDeploymentVersion": "v1.2.3",
      "lastDeploymentEnvironment": "PRODUCTION",
      "lastDeploymentStatus": "SUCCESS",
      "lastDeployedAt": "2026-07-01T11:00:00"
    }
  ],
  "recentDeployments": [
    {
      "id": 1,
      "serviceName": "customer-web",
      "version": "v1.2.3",
      "environment": "PRODUCTION",
      "status": "SUCCESS",
      "deployedBy": "mason",
      "deployedAt": "2026-07-01T11:00:00",
      "summary": "결제 화면 UI 개선 및 오류 수정"
    }
  ],
  "topDeployedServices": [
    {
      "serviceId": 1,
      "serviceName": "customer-web",
      "deploymentCount": 6,
      "successCount": 5,
      "failedCount": 1,
      "inProgressCount": 0
    }
  ]
}
```
