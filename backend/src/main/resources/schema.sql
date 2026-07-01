-- Service 목록은 status 필터와 name 오름차순 정렬을 함께 사용한다.
-- status 선두 복합 인덱스는 status 필터 조회와 countByStatus(status)를 함께 지원한다.
create index idx_services_status_name on services(status, name);

-- status 없이 전체 서비스 목록을 name 오름차순으로 정렬할 때 사용한다.
-- keyword 검색은 lower(name) like '%keyword%' 형태라 일반 B-tree 인덱스 효율을 기대하기 어렵다.
create index idx_services_name on services(name);

-- 배포 목록 기본 정렬, 최근 10건, 최근 7일 집계 조회는 deployed_at desc, id desc 순서를 사용한다.
create index idx_deployments_deployed_at_id on deployments(deployed_at desc, id desc);

-- 특정 서비스의 최신 배포 조회와 serviceId 필터가 있는 배포 목록 조회를 지원한다.
create index idx_deployments_service_deployed_at_id on deployments(service_id, deployed_at desc, id desc);

-- 특정 서비스의 환경별 최신 배포 조회에서 service_id + environment 기준 최신 행을 빠르게 찾는다.
create index idx_deployments_service_environment_deployed_at_id
    on deployments(service_id, environment, deployed_at desc, id desc);

-- 최근 실패/롤백 배포와 status 필터가 있는 배포 목록 조회를 정렬 순서까지 맞춰 지원한다.
create index idx_deployments_status_deployed_at_id on deployments(status, deployed_at desc, id desc);

-- environment 필터가 있는 배포 목록 조회를 정렬 순서까지 맞춰 지원한다.
create index idx_deployments_environment_deployed_at_id on deployments(environment, deployed_at desc, id desc);

-- branch 필터가 있는 배포 목록 조회를 정렬 순서까지 맞춰 지원한다.
create index idx_deployments_branch_deployed_at_id on deployments(branch, deployed_at desc, id desc);

-- Deployment 상세 조회에서 변경 목록을 deployment_id로 조인한다.
create index idx_deployment_changes_deployment_id on deployment_changes(deployment_id);
