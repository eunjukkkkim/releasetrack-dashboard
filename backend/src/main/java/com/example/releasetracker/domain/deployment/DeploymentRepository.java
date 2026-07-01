package com.example.releasetracker.domain.deployment;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeploymentRepository extends JpaRepository<Deployment, Long>, JpaSpecificationExecutor<Deployment> {

    @Override
    @EntityGraph(attributePaths = "service")
    Page<Deployment> findAll(Specification<Deployment> spec, Pageable pageable);

    boolean existsByServiceId(Long serviceId);

    @EntityGraph(attributePaths = "service")
    @Query("""
            select d
            from Deployment d
            where not exists (
                select 1
                from Deployment newer
                where newer.service = d.service
                  and (
                      newer.deployedAt > d.deployedAt
                      or (newer.deployedAt = d.deployedAt and newer.id > d.id)
                  )
            )
            order by d.deployedAt desc, d.id desc
            """)
    List<Deployment> findLatestDeploymentsByService();

    /**
     * 서비스별 "마지막 배포"를 단일 쿼리로 조회해 serviceId -> 최신 Deployment 맵으로 반환한다.
     * (서비스마다 findFirstByServiceIdOrderByDeployedAtDescIdDesc 를 호출하던 N+1 을 제거하기 위한 공용 헬퍼.
     * 대시보드 집계와 서비스 목록 조회가 함께 재사용한다.)
     * 정렬은 deployedAt desc, id desc 로 고정되어 deployedAt 동률 시에도 결정적이며,
     * 단건 조회(findFirstByServiceIdOrderByDeployedAtDescIdDesc)와 동일한 "최신"을 가리킨다.
     */
    default Map<Long, Deployment> findLatestDeploymentByServiceId() {
        Map<Long, Deployment> latestByServiceId = new HashMap<>();
        for (Deployment deployment : findLatestDeploymentsByService()) {
            latestByServiceId.put(deployment.getService().getId(), deployment);
        }
        return latestByServiceId;
    }

    @EntityGraph(attributePaths = "service")
    @Query("""
            select d
            from Deployment d
            where d.service.id = :serviceId
              and not exists (
                  select 1
                  from Deployment newer
                  where newer.service = d.service
                    and newer.environment = d.environment
                    and (
                        newer.deployedAt > d.deployedAt
                        or (newer.deployedAt = d.deployedAt and newer.id > d.id)
                    )
              )
            order by d.environment asc
            """)
    List<Deployment> findLatestDeploymentsByServiceGroupedByEnvironment(@Param("serviceId") Long serviceId);

    /**
     * 특정 서비스의 환경별 "전기간 최신 배포"를 단일 쿼리로 조회해 environment -> 최신 Deployment 맵으로 반환한다.
     * (findLatestDeploymentByServiceId 와 동일 패턴이되 serviceId 필터만 추가. 환경 파이프라인 엔드포인트가 사용한다.)
     * 정렬은 deployedAt desc, id desc 로 고정되어 deployedAt 동률 시에도 결정적이다(동률은 id 가 큰 쪽).
     * 결과를 인메모리 EnumMap 에 putIfAbsent 로 담아 환경별 첫 항목(=최신)만 남기므로 추가 쿼리·N+1 이 없다.
     */
    default Map<DeploymentEnvironment, Deployment> findLatestDeploymentByServiceIdGroupedByEnvironment(Long serviceId) {
        Map<DeploymentEnvironment, Deployment> latestByEnvironment = new EnumMap<>(DeploymentEnvironment.class);
        for (Deployment deployment : findLatestDeploymentsByServiceGroupedByEnvironment(serviceId)) {
            latestByEnvironment.put(deployment.getEnvironment(), deployment);
        }
        return latestByEnvironment;
    }

    @EntityGraph(attributePaths = {"service", "changes"})
    @Query("select d from Deployment d where d.id = :id")
    Optional<Deployment> findWithServiceAndChangesById(@Param("id") Long id);

    @EntityGraph(attributePaths = "service")
    Optional<Deployment> findFirstByServiceIdOrderByDeployedAtDescIdDesc(Long serviceId);

    @EntityGraph(attributePaths = "service")
    List<Deployment> findTop10ByOrderByDeployedAtDescIdDesc();

    /**
     * "최근 7일" 윈도우 조회. 하한(from) 이상 ~ 상한(toExclusive) 미만으로 양방향 경계를 가진다.
     * 상한은 today.plusDays(1).atStartOfDay() 를 배타(LessThan)로 넘겨 당일(today) 배포까지 포함하되
     * 미래 일시(today+1 이후) 배포는 일관되게 제외한다. 이렇게 해야 KPI·series·points 가 동일한 7일 모집단을 본다.
     * 정렬은 deployedAt desc, id desc 로 고정해 동률에도 결정적이다.
     */
    @EntityGraph(attributePaths = "service")
    List<Deployment> findByDeployedAtGreaterThanEqualAndDeployedAtLessThanOrderByDeployedAtDescIdDesc(
            LocalDateTime from, LocalDateTime toExclusive);

    @EntityGraph(attributePaths = "service")
    List<Deployment> findByStatusInOrderByDeployedAtDescIdDesc(List<DeploymentStatus> statuses, Pageable pageable);

    @Query("""
            select new com.example.releasetracker.domain.deployment.ServiceDeploymentCount(
                d.service.id, d.service.name, count(d.id),
                sum(case when d.status = com.example.releasetracker.domain.deployment.DeploymentStatus.SUCCESS then 1L else 0L end),
                sum(case when d.status in (com.example.releasetracker.domain.deployment.DeploymentStatus.FAILED,
                                           com.example.releasetracker.domain.deployment.DeploymentStatus.ROLLED_BACK) then 1L else 0L end),
                sum(case when d.status in (com.example.releasetracker.domain.deployment.DeploymentStatus.RUNNING,
                                           com.example.releasetracker.domain.deployment.DeploymentStatus.QUEUED) then 1L else 0L end))
            from Deployment d
            group by d.service.id, d.service.name
            order by count(d.id) desc, d.service.name asc
            """)
    List<ServiceDeploymentCount> findTopDeployedServices(Pageable pageable);

}
