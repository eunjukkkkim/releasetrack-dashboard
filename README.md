# ReleaseTrack Dashboard

서비스 배포 현황을 추적하고 운영 지표를 확인하는 대시보드 프로젝트입니다.

Spring Boot REST API와 React 대시보드로 구성되어 있으며, 로컬에서 백엔드와 프론트엔드를 각각 실행해 확인할 수 있습니다.

## 기술 스택

- Backend: Java 17, Spring Boot 3.3.13 (Web / Data JPA / Validation), H2 Database, Gradle
- Frontend: React 18, TypeScript 5, Vite 5, TanStack Query, Axios, Recharts, Radix UI, Tailwind CSS v4
- Test: Spring Boot Test(MockMvc), Vitest

## 프로젝트 구조

```text
releaseTrackerDashboard
├── backend        # Spring Boot REST API
├── frontend       # React 대시보드
└── README.md
```

## 실행 방법

권장 로컬 버전:

- Java 17 이상
- Node.js 24 LTS (`v24.18.0` 검증)
- npm 11 (`v11.16.0` 검증)

`nvm`을 사용한다면 루트에서 아래 명령으로 Node 버전을 맞출 수 있습니다.

```bash
nvm use
```

### Backend

Java 17 이상이 필요합니다. 백엔드는 항상 8080 포트로 실행합니다.

```bash
cd backend
./gradlew bootRun
```

실행 주소 (고정):

```text
http://localhost:8080
```

H2 Console:

```text
http://localhost:8080/h2-console
```

H2 접속 정보:

```text
JDBC URL: jdbc:h2:mem:releasetracker
User Name: sa
Password:
```

### Frontend

Node.js 24 LTS와 npm 11을 권장합니다. 프론트엔드는 항상 5173 포트로 실행하며, 백엔드(8080)에 연결합니다.

```bash
cd frontend
npm install
npm run dev
```

실행 주소:

```text
http://localhost:5173
```

별도 환경 변수 설정 없이 백엔드 `http://localhost:8080` 에 연결됩니다.

## 테스트

Backend:

```bash
cd backend
./gradlew test
```

Frontend:

```bash
cd frontend
npm run test
```

## 상세 문서

- [Backend README](backend/README.md)
- [Frontend README](frontend/README.md)
