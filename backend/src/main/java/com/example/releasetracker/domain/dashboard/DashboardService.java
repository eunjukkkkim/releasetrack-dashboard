package com.example.releasetracker.domain.dashboard;

import com.example.releasetracker.domain.dashboard.dto.DashboardSummaryResponse;
import com.example.releasetracker.domain.dashboard.dto.RecentFailedDeploymentResponse;
import com.example.releasetracker.domain.dashboard.dto.RecentDeploymentResponse;
import com.example.releasetracker.domain.dashboard.dto.ServiceDeploymentStatusResponse;
import com.example.releasetracker.domain.dashboard.dto.ServicePipelineStageResponse;
import com.example.releasetracker.domain.dashboard.dto.TopDeployedServiceResponse;
import com.example.releasetracker.domain.dashboard.DeploymentStatsAggregator.DeploymentWindowStats;
import com.example.releasetracker.domain.deployment.Deployment;
import com.example.releasetracker.domain.deployment.DeploymentEnvironment;
import com.example.releasetracker.domain.deployment.DeploymentRepository;
import com.example.releasetracker.domain.deployment.DeploymentStatus;
import com.example.releasetracker.domain.service.ManagedService;
import com.example.releasetracker.domain.service.ManagedServiceRepository;
import com.example.releasetracker.domain.service.ServiceStatus;
import com.example.releasetracker.global.exception.ResourceNotFoundException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final ManagedServiceRepository serviceRepository;
    private final DeploymentRepository deploymentRepository;
    private final DeploymentStatsAggregator statsAggregator;

    public DashboardService(
            ManagedServiceRepository serviceRepository,
            DeploymentRepository deploymentRepository,
            DeploymentStatsAggregator statsAggregator
    ) {
        this.serviceRepository = serviceRepository;
        this.deploymentRepository = deploymentRepository;
        this.statsAggregator = statsAggregator;
    }

    public DashboardSummaryResponse getSummary() {
        LocalDate today = LocalDate.now();
        LocalDate weekStartDate = today.minusDays(6);
        LocalDateTime weekStart = weekStartDate.atStartOfDay();
        // 상한은 내일 00:00 배타 → today 23:59:59.999... 까지 포함하되 미래 일시 배포는 제외.
        // KPI·series·points 가 동일한 7일 모집단(today-6 ~ today)을 보도록 정합화한다.
        LocalDateTime weekEndExclusive = today.plusDays(1).atStartOfDay();
        List<Deployment> weeklyDeployments = deploymentRepository
                .findByDeployedAtGreaterThanEqualAndDeployedAtLessThanOrderByDeployedAtDescIdDesc(weekStart, weekEndExclusive);
        List<ManagedService> services = serviceRepository.findAll();
        Map<Long, Deployment> lastDeploymentByServiceId = deploymentRepository.findLatestDeploymentByServiceId();
        DeploymentWindowStats weeklyStats = statsAggregator.summarize(weeklyDeployments, weekStartDate, today);

        return new DashboardSummaryResponse(
                serviceRepository.count(),
                serviceRepository.countByStatus(ServiceStatus.ACTIVE),
                weeklyStats.weeklyDeploymentCount(),
                weeklyStats.productionDeploymentCount(),
                weeklyStats.successDeploymentCount(),
                weeklyStats.failedDeploymentCount(),
                weeklyStats.rollbackCount(),
                weeklyStats.successRate(),
                weeklyStats.deploymentTrendByStatus(),
                weeklyStats.statusStats(),
                weeklyStats.statusStatsByEnvironment(),
                deploymentRepository.findByStatusInOrderByDeployedAtDescIdDesc(
                                List.of(DeploymentStatus.FAILED, DeploymentStatus.ROLLED_BACK),
                                PageRequest.of(0, 5)
                        )
                        .stream()
                        .map(RecentFailedDeploymentResponse::from)
                        .toList(),
                buildServiceDeploymentStatuses(services, lastDeploymentByServiceId, today),
                deploymentRepository.findTop10ByOrderByDeployedAtDescIdDesc()
                        .stream()
                        .map(RecentDeploymentResponse::from)
                        .toList(),
                deploymentRepository.findTopDeployedServices(PageRequest.of(0, 5))
                        .stream()
                        .map(TopDeployedServiceResponse::from)
                        .toList()
        );
    }

    /**
     * 특정 서비스의 환경별 최신 배포 카드를 DEV, STAGING, PRODUCTION 고정 순서로 항상 3개 반환한다.
     * serviceId 미존재 시 404(ResourceNotFoundException). 단일 쿼리 결과를 인메모리 매핑만 하므로 N+1 이 없다.
     * 서비스가 존재하지만 어떤 환경에도 배포가 없으면 environment 외 전부 null 인 빈 카드 3개를 200 으로 반환한다.
     */
    public List<ServicePipelineStageResponse> getServicePipeline(Long serviceId) {
        if (!serviceRepository.existsById(serviceId)) {
            throw new ResourceNotFoundException("서비스를 찾을 수 없습니다. serviceId=" + serviceId);
        }
        Map<DeploymentEnvironment, Deployment> latestByEnvironment =
                deploymentRepository.findLatestDeploymentByServiceIdGroupedByEnvironment(serviceId);
        return Arrays.stream(DeploymentEnvironment.values())
                .map(environment -> ServicePipelineStageResponse.from(environment, latestByEnvironment.get(environment)))
                .toList();
    }

    private List<ServiceDeploymentStatusResponse> buildServiceDeploymentStatuses(
            List<ManagedService> services,
            Map<Long, Deployment> lastDeploymentByServiceId,
            LocalDate today
    ) {
        return services.stream()
                .map(service -> ServiceDeploymentStatusResponse.from(
                        service, lastDeploymentByServiceId.get(service.getId()), today))
                .toList();
    }
}
