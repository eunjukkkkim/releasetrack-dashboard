-- ReleaseTrack Dashboard 시드 데이터 (정합성 재설계판)
-- 날짜는 상대(current_timestamp/dateadd)로 유지한다. 실행 시점 기준으로 "최근 7일"·인플라이트("오늘")가 항상 성립한다.
-- 정합성 규칙(R1~R6) 요약:
--   R1 인플라이트(QUEUED/RUNNING)는 반드시 "오늘"(분/시간 단위). RUNNING=started 채움·finished null, QUEUED=둘 다 null.
--   R2 터미널(SUCCESS/FAILED/ROLLED_BACK)은 started=deployed, finished=deployed+durationSec. failure_reason 은 FAILED/ROLLED_BACK 만.
--   R3 승격 순서: 같은 버전은 시간순 DEV→STAGING→PROD. STAGING 이 FAILED 면 그 버전 PROD 행 없음.
--   R4 파이프라인 스냅샷: 서비스별 latest-per-env 에서 버전(DEV)≥버전(STAGING)≥버전(PROD). STAGING 최신 FAILED(새 버전)이면 PROD 최신(옛 안정)은 그 실패 이전.
--   R5 gitflow: develop→DEV, release/*→STAGING, main→PRODUCTION. legacy 행(id23)만 branch/commit null 로 nullable 렌더 검증.
--   R6 ARCHIVED(legacy-report)는 최근(~20일 내) 신규 배포 없음. MAINTENANCE(payment-worker)는 최근 PROD 지양.

insert into services (id, name, description, owner, repository_url, status, created_at, updated_at)
values
    (1, 'customer-web', '고객용 웹 서비스', 'frontend-team', 'https://github.com/example/customer-web', 'ACTIVE', current_timestamp, current_timestamp),
    (2, 'admin-api', '관리자 API 서비스', 'platform-team', 'https://github.com/example/admin-api', 'ACTIVE', current_timestamp, current_timestamp),
    (3, 'payment-worker', '결제 비동기 처리 워커', 'payment-team', 'https://github.com/example/payment-worker', 'MAINTENANCE', current_timestamp, current_timestamp),
    (4, 'order-api', '주문 처리 API 서비스', 'commerce-team', 'https://github.com/example/order-api', 'ACTIVE', current_timestamp, current_timestamp),
    (5, 'inventory-batch', '재고 동기화 배치', 'ops-team', 'https://github.com/example/inventory-batch', 'ACTIVE', current_timestamp, current_timestamp),
    (6, 'legacy-report', '구 리포트 서비스', 'data-team', 'https://github.com/example/legacy-report', 'ARCHIVED', current_timestamp, current_timestamp),
    (7, 'notification-api', '알림 발송 API 서비스', 'platform-team', 'https://github.com/example/notification-api', 'ACTIVE', current_timestamp, current_timestamp),
    (8, 'billing-cron', '청구 정산 스케줄러', 'billing-team', 'https://github.com/example/billing-cron', 'ACTIVE', current_timestamp, current_timestamp),
    (9, 'search-api', '검색 색인/질의 API 서비스', 'discovery-team', 'https://github.com/example/search-api', 'ACTIVE', current_timestamp, current_timestamp),
    (10, 'auth-service', '인증/인가 서비스', 'identity-team', 'https://github.com/example/auth-service', 'ACTIVE', current_timestamp, current_timestamp),
    (11, 'metrics-worker', '지표 수집 워커(장기 미배포)', 'observability-team', 'https://github.com/example/metrics-worker', 'ACTIVE', current_timestamp, current_timestamp),
    (12, 'gateway-proxy', 'API 게이트웨이 프록시', 'platform-team', 'https://github.com/example/gateway-proxy', 'ACTIVE', current_timestamp, current_timestamp);

-- 배포 시드: 총 36행.
--   최근 7일 윈도우(id1~id18, D-6~D0): weekly=18 (SUCCESS10 / FAILED2 / ROLLED_BACK1 / RUNNING3 / QUEUED2, PRODUCTION7).
--   오늘 인플라이트(id2~id6): RUNNING3 + QUEUED2, 전부 "오늘"(분/시간 오프셋).
--   과거 이력(id19~id36, D-8~D-22): 롤백/실패/stale 맥락. 윈도우 밖이라 KPI/추이/statusStats 에 미포함.
insert into deployments (
    id, service_id, version, environment, status, deployed_by, deployed_at, started_at, finished_at,
    commit_sha, branch, summary, failure_reason, rollbacked, created_at, updated_at
)
values
    -- customer-web PROD 안정버전(옛). 상세/변경 검증 앵커(id1, changes 2건). 스테이징 실패(id8) "이전"이라 역행 없음.
    (1, 1, 'v1.2.3', 'PRODUCTION', 'SUCCESS', 'mason',
        dateadd('DAY', -3, current_timestamp), dateadd('DAY', -3, current_timestamp), dateadd('SECOND', 420, dateadd('DAY', -3, current_timestamp)),
        'a1b2c3d4e5f60718293a4b5c6d7e8f9012340001', 'main', '결제 화면 UI 개선 및 오류 수정', null, false, current_timestamp, current_timestamp),
    -- 인플라이트(오늘): admin-api 다음 버전 DEV RUNNING.
    (2, 2, 'v2.2.0', 'DEV', 'RUNNING', 'jun',
        dateadd('HOUR', -2, current_timestamp), dateadd('HOUR', -2, current_timestamp), null,
        'b2c3d4e5f60718293a4b5c6d7e8f9012340002', 'develop', '관리자 대시보드 위젯 재구성', null, false, current_timestamp, current_timestamp),
    -- 인플라이트(오늘): order-api 신버전 STAGING RUNNING(롤백된 v3.4.0 다음 시도 v3.5.0).
    (3, 4, 'v3.5.0', 'STAGING', 'RUNNING', 'leo',
        dateadd('HOUR', -1, current_timestamp), dateadd('HOUR', -1, current_timestamp), null,
        'c3d4e5f60718293a4b5c6d7e8f9012340003', 'release/3.5', '주문 파이프라인 재처리 검증', null, false, current_timestamp, current_timestamp),
    -- 인플라이트(오늘): inventory-batch 신버전 STAGING RUNNING.
    (4, 5, 'v1.1.0', 'STAGING', 'RUNNING', 'nina',
        dateadd('HOUR', -3, current_timestamp), dateadd('HOUR', -3, current_timestamp), null,
        'd4e5f60718293a4b5c6d7e8f9012340004', 'release/1.1', '재고 동기화 배치 병렬화', null, false, current_timestamp, current_timestamp),
    -- 인플라이트(오늘): customer-web 다음 버전 DEV QUEUED(파이프라인 DEV 최신).
    (5, 1, 'v1.2.5', 'DEV', 'QUEUED', 'mason',
        dateadd('MINUTE', -30, current_timestamp), null, null,
        'e5f60718293a4b5c6d7e8f90123400010005', 'develop', '고객 웹 배너 A/B 실험 배포 대기', null, false, current_timestamp, current_timestamp),
    -- 인플라이트(오늘): notification-api 다음 버전 DEV QUEUED.
    (6, 7, 'v1.3.0', 'DEV', 'QUEUED', 'chris',
        dateadd('MINUTE', -45, current_timestamp), null, null,
        'f60718293a4b5c6d7e8f9012340006000006', 'develop', '알림 채널 확장 배포 대기', null, false, current_timestamp, current_timestamp),
    -- customer-web v1.2.4 승격 시도: DEV 성공(D-2) → STAGING 실패(D-1) → PROD 없음(R3).
    (7, 1, 'v1.2.4', 'DEV', 'SUCCESS', 'mason',
        dateadd('DAY', -2, current_timestamp), dateadd('DAY', -2, current_timestamp), dateadd('SECOND', 90, dateadd('DAY', -2, current_timestamp)),
        '0718293a4b5c6d7e8f9012340007000000007', 'develop', '주문 내역 화면 개선(개발 검증)', null, false, current_timestamp, current_timestamp),
    (8, 1, 'v1.2.4', 'STAGING', 'FAILED', 'erin',
        dateadd('DAY', -1, current_timestamp), dateadd('DAY', -1, current_timestamp), dateadd('SECOND', 900, dateadd('DAY', -1, current_timestamp)),
        '18293a4b5c6d7e8f90123400080000000000008', 'release/1.2', '주문 내역 화면 개선(스테이징)', '스테이징 통합 테스트 실패', false, current_timestamp, current_timestamp),
    -- search-api v0.8.0 PROD 성공(D-1).
    (9, 9, 'v0.8.0', 'PRODUCTION', 'SUCCESS', 'iris',
        dateadd('DAY', -1, current_timestamp), dateadd('DAY', -1, current_timestamp), dateadd('SECOND', 300, dateadd('DAY', -1, current_timestamp)),
        '293a4b5c6d7e8f9012340009000000000000009', 'main', '검색 색인 스키마 v2 적용', null, false, current_timestamp, current_timestamp),
    -- admin-api v2.1.0 승격 완주: DEV(D-5)→STAGING(D-4)→PROD(D-2) 전부 성공.
    (10, 2, 'v2.1.0', 'PRODUCTION', 'SUCCESS', 'jun',
        dateadd('DAY', -2, current_timestamp), dateadd('DAY', -2, current_timestamp), dateadd('SECOND', 180, dateadd('DAY', -2, current_timestamp)),
        '3a4b5c6d7e8f9012340010000000000000000010', 'main', '관리자 권한 정책 개선', null, false, current_timestamp, current_timestamp),
    -- order-api v3.4.0 PROD 롤백(D-2). 다음 시도 v3.5.0 은 인플라이트(id3).
    (11, 4, 'v3.4.0', 'PRODUCTION', 'ROLLED_BACK', 'leo',
        dateadd('DAY', -2, current_timestamp), dateadd('DAY', -2, current_timestamp), dateadd('SECOND', 1200, dateadd('DAY', -2, current_timestamp)),
        '4b5c6d7e8f9012340011000000000000000011', 'main', '쿠폰 적용 로직 배포', '쿠폰 중복 적용 오류로 롤백', true, current_timestamp, current_timestamp),
    -- order-api v3.5.0 DEV 성공(D-3) → STAGING 승격(id3, 오늘) 근거.
    (12, 4, 'v3.5.0', 'DEV', 'SUCCESS', 'leo',
        dateadd('DAY', -3, current_timestamp), dateadd('DAY', -3, current_timestamp), dateadd('SECOND', 120, dateadd('DAY', -3, current_timestamp)),
        '5c6d7e8f9012340012000000000000000000012', 'develop', '주문 파이프라인 재처리(개발)', null, false, current_timestamp, current_timestamp),
    -- admin-api v2.1.0 STAGING 성공(D-4).
    (13, 2, 'v2.1.0', 'STAGING', 'SUCCESS', 'jun',
        dateadd('DAY', -4, current_timestamp), dateadd('DAY', -4, current_timestamp), dateadd('SECOND', 240, dateadd('DAY', -4, current_timestamp)),
        '6d7e8f9012340013000000000000000000000013', 'release/2.1', '관리자 권한 정책(스테이징)', null, false, current_timestamp, current_timestamp),
    -- inventory-batch v1.0.9 PROD 성공(D-4).
    (14, 5, 'v1.0.9', 'PRODUCTION', 'SUCCESS', 'nina',
        dateadd('DAY', -4, current_timestamp), dateadd('DAY', -4, current_timestamp), dateadd('SECOND', 300, dateadd('DAY', -4, current_timestamp)),
        '7e8f9012340014000000000000000000000014', 'main', '재고 동기화 성능 개선', null, false, current_timestamp, current_timestamp),
    -- admin-api v2.1.0 DEV 성공(D-5).
    (15, 2, 'v2.1.0', 'DEV', 'SUCCESS', 'jun',
        dateadd('DAY', -5, current_timestamp), dateadd('DAY', -5, current_timestamp), dateadd('SECOND', 90, dateadd('DAY', -5, current_timestamp)),
        '8f9012340015000000000000000000000000015', 'develop', '관리자 권한 정책(개발)', null, false, current_timestamp, current_timestamp),
    -- auth-service v4.0.1 PROD 성공(D-5). STAGING 성공(id26) 이후 정상 승격.
    (16, 10, 'v4.0.1', 'PRODUCTION', 'SUCCESS', 'omar',
        dateadd('DAY', -5, current_timestamp), dateadd('DAY', -5, current_timestamp), dateadd('SECOND', 360, dateadd('DAY', -5, current_timestamp)),
        '9012340016000000000000000000000000000016', 'main', '토큰 교체 정책 강화', null, false, current_timestamp, current_timestamp),
    -- notification-api v1.2.0 STAGING 실패(D-6). PROD 승격 없음(R3). PROD 최신은 옛 v1.1.0(id33).
    (17, 7, 'v1.2.0', 'STAGING', 'FAILED', 'chris',
        dateadd('DAY', -6, current_timestamp), dateadd('DAY', -6, current_timestamp), dateadd('SECOND', 600, dateadd('DAY', -6, current_timestamp)),
        '012340017000000000000000000000000000017', 'release/1.2', '알림 템플릿 엔진 교체(스테이징)', '알림 발송 지연 임계 초과', false, current_timestamp, current_timestamp),
    -- gateway-proxy v2.5.0 PROD 성공(D-6). STAGING 성공(id35) 이후 승격.
    (18, 12, 'v2.5.0', 'PRODUCTION', 'SUCCESS', 'paula',
        dateadd('DAY', -6, current_timestamp), dateadd('DAY', -6, current_timestamp), dateadd('SECOND', 300, dateadd('DAY', -6, current_timestamp)),
        '12340018000000000000000000000000000018', 'main', '게이트웨이 라우팅 규칙 정리', null, false, current_timestamp, current_timestamp),

    -- ===== 윈도우 밖 과거 이력(D-8 ~ D-22) =====
    -- admin-api 옛 PROD 롤백(D-10). 최신 PROD 는 v2.1.0(id10) 이라 스냅샷 영향 없음.
    (19, 2, 'v1.9.9', 'PRODUCTION', 'ROLLED_BACK', 'jun',
        dateadd('DAY', -10, current_timestamp), dateadd('DAY', -10, current_timestamp), dateadd('SECOND', 800, dateadd('DAY', -10, current_timestamp)),
        '12340019000000000000000000000000000019', 'main', '관리자 감사 로그 배포', '감사 로그 저장 지연으로 롤백', true, current_timestamp, current_timestamp),
    -- order-api 옛 PROD 안정(D-12).
    (20, 4, 'v3.3.0', 'PRODUCTION', 'SUCCESS', 'leo',
        dateadd('DAY', -12, current_timestamp), dateadd('DAY', -12, current_timestamp), dateadd('SECOND', 240, dateadd('DAY', -12, current_timestamp)),
        '12340020000000000000000000000000000020', 'main', '주문 상태 전환 안정화', null, false, current_timestamp, current_timestamp),
    -- payment-worker(MAINTENANCE) DEV/STAGING 최근 이력(최근 PROD 는 지양 → 옛 v0.9.8 만).
    (21, 3, 'v0.9.9', 'DEV', 'SUCCESS', 'sofia',
        dateadd('DAY', -9, current_timestamp), dateadd('DAY', -9, current_timestamp), dateadd('SECOND', 60, dateadd('DAY', -9, current_timestamp)),
        '12340021000000000000000000000000000021', 'develop', '결제 이벤트 재처리(개발)', null, false, current_timestamp, current_timestamp),
    (22, 3, 'v0.9.9', 'STAGING', 'SUCCESS', 'sofia',
        dateadd('DAY', -8, current_timestamp), dateadd('DAY', -8, current_timestamp), dateadd('SECOND', 45, dateadd('DAY', -8, current_timestamp)),
        '12340022000000000000000000000000000022', 'release/0.9', '결제 이벤트 재처리(스테이징)', null, false, current_timestamp, current_timestamp),
    -- legacy-report(ARCHIVED) 옛 PROD(D-22). branch/commit null(R5 legacy 렌더 검증). 최근(~20일 내) 신규 배포 없음(R6).
    (23, 6, 'v0.5.2', 'PRODUCTION', 'SUCCESS', 'dana',
        dateadd('DAY', -22, current_timestamp), dateadd('DAY', -22, current_timestamp), dateadd('SECOND', 300, dateadd('DAY', -22, current_timestamp)),
        null, null, '월간 리포트 템플릿 수정', null, false, current_timestamp, current_timestamp),
    -- metrics-worker: 마지막 배포 D-20(장기 미배포, 경과일 경고 대상).
    (24, 11, 'v1.4.0', 'PRODUCTION', 'SUCCESS', 'quinn',
        dateadd('DAY', -20, current_timestamp), dateadd('DAY', -20, current_timestamp), dateadd('SECOND', 300, dateadd('DAY', -20, current_timestamp)),
        '12340024000000000000000000000000000024', 'main', '지표 수집 파이프라인 개편', null, false, current_timestamp, current_timestamp),
    -- order-api 옛 STAGING 실패(D-14). 최신 STAGING 은 v3.5.0(id3) 이라 스냅샷 영향 없음. PROD v3.2.0 없음(R3).
    (25, 4, 'v3.2.0', 'STAGING', 'FAILED', 'leo',
        dateadd('DAY', -14, current_timestamp), dateadd('DAY', -14, current_timestamp), dateadd('SECOND', 700, dateadd('DAY', -14, current_timestamp)),
        '12340025000000000000000000000000000025', 'release/3.2', '주문 스키마 마이그레이션(스테이징)', '주문 스키마 마이그레이션 실패', false, current_timestamp, current_timestamp),
    -- auth-service v4.0.1 STAGING 성공(D-8, 윈도우 밖) → PROD 승격(id16, D-5) 근거. staging(-8d) < prod(-5d).
    (26, 10, 'v4.0.1', 'STAGING', 'SUCCESS', 'omar',
        dateadd('DAY', -8, current_timestamp), dateadd('DAY', -8, current_timestamp), dateadd('SECOND', 200, dateadd('DAY', -8, current_timestamp)),
        '12340026000000000000000000000000000026', 'release/4.0', '토큰 교체 정책(스테이징)', null, false, current_timestamp, current_timestamp),
    -- customer-web 옛 PROD 안정(D-18). 최신 PROD 는 v1.2.3(id1).
    (27, 1, 'v1.1.9', 'PRODUCTION', 'SUCCESS', 'mason',
        dateadd('DAY', -18, current_timestamp), dateadd('DAY', -18, current_timestamp), dateadd('SECOND', 360, dateadd('DAY', -18, current_timestamp)),
        '12340027000000000000000000000000000027', 'main', '고객 메뉴 구조 개선', null, false, current_timestamp, current_timestamp),
    -- customer-web 옛 STAGING/DEV(D-20/D-21). 최신 STAGING/DEV 는 각각 id8/id5.
    (28, 1, 'v1.2.0', 'STAGING', 'SUCCESS', 'erin',
        dateadd('DAY', -20, current_timestamp), dateadd('DAY', -20, current_timestamp), dateadd('SECOND', 150, dateadd('DAY', -20, current_timestamp)),
        '12340028000000000000000000000000000028', 'release/1.2', '고객 메뉴 구조 개선(스테이징)', null, false, current_timestamp, current_timestamp),
    (29, 1, 'v1.2.0', 'DEV', 'SUCCESS', 'mason',
        dateadd('DAY', -21, current_timestamp), dateadd('DAY', -21, current_timestamp), dateadd('SECOND', 80, dateadd('DAY', -21, current_timestamp)),
        '12340029000000000000000000000000000029', 'develop', '고객 메뉴 구조 개선(개발)', null, false, current_timestamp, current_timestamp),
    -- order-api 옛 DEV(D-13).
    (30, 4, 'v3.3.0', 'DEV', 'SUCCESS', 'leo',
        dateadd('DAY', -13, current_timestamp), dateadd('DAY', -13, current_timestamp), dateadd('SECOND', 100, dateadd('DAY', -13, current_timestamp)),
        '12340030000000000000000000000000000030', 'develop', '주문 상태 전환 안정화(개발)', null, false, current_timestamp, current_timestamp),
    -- inventory-batch DEV 최신 v1.1.0(D-8) → 스냅샷 DEV 최신. STAGING v1.0.9(D-7)/PROD v1.0.9(id14) 승격 라인.
    (31, 5, 'v1.1.0', 'DEV', 'SUCCESS', 'nina',
        dateadd('DAY', -8, current_timestamp), dateadd('DAY', -8, current_timestamp), dateadd('SECOND', 70, dateadd('DAY', -8, current_timestamp)),
        '12340031000000000000000000000000000031', 'develop', '재고 동기화 배치 병렬화(개발)', null, false, current_timestamp, current_timestamp),
    (32, 5, 'v1.0.9', 'STAGING', 'SUCCESS', 'nina',
        dateadd('DAY', -7, current_timestamp), dateadd('DAY', -7, current_timestamp), dateadd('SECOND', 60, dateadd('DAY', -7, current_timestamp)),
        '12340032000000000000000000000000000032', 'release/1.0', '재고 동기화 성능 개선(스테이징)', null, false, current_timestamp, current_timestamp),
    -- notification-api 옛 PROD 안정 v1.1.0(D-16) → 스냅샷 PROD 최신(스테이징 실패 id17 이전).
    (33, 7, 'v1.1.0', 'PRODUCTION', 'SUCCESS', 'chris',
        dateadd('DAY', -16, current_timestamp), dateadd('DAY', -16, current_timestamp), dateadd('SECOND', 260, dateadd('DAY', -16, current_timestamp)),
        '12340033000000000000000000000000000033', 'main', '알림 발송 재시도 로직 배포', null, false, current_timestamp, current_timestamp),
    -- search-api 옛 DEV(D-8).
    (34, 9, 'v0.8.0', 'DEV', 'SUCCESS', 'iris',
        dateadd('DAY', -8, current_timestamp), dateadd('DAY', -8, current_timestamp), dateadd('SECOND', 110, dateadd('DAY', -8, current_timestamp)),
        '12340034000000000000000000000000000034', 'develop', '검색 색인 스키마 v2(개발)', null, false, current_timestamp, current_timestamp),
    -- gateway-proxy 옛 STAGING(D-8) → PROD 승격(id18) 근거.
    (35, 12, 'v2.5.0', 'STAGING', 'SUCCESS', 'paula',
        dateadd('DAY', -8, current_timestamp), dateadd('DAY', -8, current_timestamp), dateadd('SECOND', 130, dateadd('DAY', -8, current_timestamp)),
        '12340035000000000000000000000000000035', 'release/2.5', '게이트웨이 라우팅 규칙(스테이징)', null, false, current_timestamp, current_timestamp),
    -- payment-worker 옛 PROD(D-19). MAINTENANCE 라 최근 PROD 지양 → 옛 이력만.
    (36, 3, 'v0.9.8', 'PRODUCTION', 'SUCCESS', 'sofia',
        dateadd('DAY', -19, current_timestamp), dateadd('DAY', -19, current_timestamp), dateadd('SECOND', 200, dateadd('DAY', -19, current_timestamp)),
        '12340036000000000000000000000000000036', 'main', '결제 정산 스케줄 조정', null, false, current_timestamp, current_timestamp);

insert into deployment_changes (id, deployment_id, change_type, description, created_at)
values
    (1, 1, 'FEATURE', '결제 완료 화면에 안내 문구 추가', current_timestamp),
    (2, 1, 'BUG_FIX', '모바일 Safari에서 버튼 클릭이 되지 않던 문제 수정', current_timestamp),
    (3, 7, 'REFACTOR', '주문 내역 필터 컴포넌트 분리', current_timestamp),
    (4, 8, 'BUG_FIX', '스테이징 API 응답 매핑 오류 수정 시도', current_timestamp),
    (5, 9, 'FEATURE', '검색 색인 스키마 v2 필드 추가', current_timestamp),
    (6, 10, 'CONFIG', '관리자 권한 기본 정책 설정 변경', current_timestamp),
    (7, 11, 'BUG_FIX', '쿠폰 적용 검증 로직 수정', current_timestamp),
    (8, 13, 'FEATURE', '관리자 권한 위임 UI 추가', current_timestamp),
    (9, 14, 'REFACTOR', '재고 동기화 쿼리 최적화', current_timestamp),
    (10, 16, 'FEATURE', '리프레시 토큰 회전 지원', current_timestamp),
    (11, 18, 'CONFIG', '게이트웨이 라우팅 테이블 갱신', current_timestamp),
    (12, 2, 'FEATURE', '관리자 대시보드 위젯 재구성', current_timestamp),
    (13, 3, 'REFACTOR', '주문 재처리 서비스 분리', current_timestamp),
    (14, 19, 'BUG_FIX', '감사 로그 저장 로직 수정', current_timestamp),
    (15, 20, 'ETC', '주문 상태 전환 타임아웃 설정 변경', current_timestamp),
    (16, 33, 'FEATURE', '알림 발송 재시도 정책 추가', current_timestamp),
    (17, 7, 'FEATURE', '주문 내역 기간 필터 추가', current_timestamp),
    (18, 7, 'BUG_FIX', '빈 주문 목록의 안내 문구 노출 조건 수정', current_timestamp),
    (19, 8, 'CONFIG', '스테이징 API 엔드포인트 설정 재검토', current_timestamp),
    (20, 8, 'ETC', '통합 테스트 실패 케이스 재현 로그 추가', current_timestamp),
    (21, 9, 'REFACTOR', '검색 인덱스 문서 변환 로직 정리', current_timestamp),
    (22, 9, 'CONFIG', '색인 재생성 배치 타임아웃 조정', current_timestamp),
    (23, 10, 'FEATURE', '역할별 권한 정책 조회 API 추가', current_timestamp),
    (24, 10, 'BUG_FIX', '권한 캐시 갱신 누락 케이스 수정', current_timestamp),
    (25, 11, 'CONFIG', '롤백 기준 알림 임계값 조정', current_timestamp),
    (26, 11, 'ETC', '쿠폰 중복 적용 장애 대응 로그 보강', current_timestamp),
    (27, 14, 'CONFIG', '재고 동기화 배치 청크 크기 조정', current_timestamp),
    (28, 14, 'ETC', '배치 처리 결과 메트릭 라벨 추가', current_timestamp),
    (29, 16, 'CONFIG', '토큰 만료 시간 정책값 갱신', current_timestamp),
    (30, 16, 'BUG_FIX', '만료 직전 토큰 재발급 경합 조건 수정', current_timestamp),
    (31, 18, 'BUG_FIX', '게이트웨이 헬스체크 라우팅 예외 처리', current_timestamp),
    (32, 18, 'ETC', '라우팅 규칙 적용 후 검증 로그 추가', current_timestamp),
    (33, 2, 'CONFIG', '위젯 표시 순서 기본값 갱신', current_timestamp),
    (34, 2, 'ETC', '관리자 대시보드 응답 시간 계측 추가', current_timestamp),
    (35, 3, 'FEATURE', '주문 재처리 요청 큐 상태 노출', current_timestamp),
    (36, 3, 'CONFIG', '스테이징 재처리 워커 동시성 제한 조정', current_timestamp),
    (37, 19, 'CONFIG', '감사 로그 저장 버퍼 크기 조정', current_timestamp),
    (38, 19, 'ETC', '롤백 후 감사 로그 재처리 절차 기록', current_timestamp),
    (39, 33, 'BUG_FIX', '알림 재시도 중복 발송 방지', current_timestamp),
    (40, 33, 'CONFIG', '재시도 백오프 정책값 조정', current_timestamp);

alter table services alter column id restart with 13;
alter table deployments alter column id restart with 37;
alter table deployment_changes alter column id restart with 41;
