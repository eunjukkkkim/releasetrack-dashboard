package com.example.releasetracker.domain.dashboard;

import com.example.releasetracker.domain.dashboard.dto.DeploymentSeriesTrendResponse;
import com.example.releasetracker.domain.dashboard.dto.EnvironmentStatusStatsResponse;
import com.example.releasetracker.domain.dashboard.dto.StatusStatResponse;
import com.example.releasetracker.domain.deployment.Deployment;
import com.example.releasetracker.domain.deployment.DeploymentEnvironment;
import com.example.releasetracker.domain.deployment.DeploymentStatus;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
class DeploymentStatsAggregator {

    private static final List<String> TREND_SERIES = List.of("SUCCESS", "FAILED", "RUNNING");
    private static final List<DeploymentStatus> TREND_SUCCESS_STATUSES = List.of(DeploymentStatus.SUCCESS);
    private static final List<DeploymentStatus> TREND_FAILED_STATUSES =
            List.of(DeploymentStatus.FAILED, DeploymentStatus.ROLLED_BACK);
    private static final List<DeploymentStatus> TREND_RUNNING_STATUSES =
            List.of(DeploymentStatus.RUNNING, DeploymentStatus.QUEUED);

    DeploymentWindowStats summarize(List<Deployment> deployments, LocalDate startDate, LocalDate endDate) {
        long successDeploymentCount = countByStatus(deployments, DeploymentStatus.SUCCESS);
        long failedDeploymentCount = countByStatus(deployments, DeploymentStatus.FAILED);
        long rollbackCount = countByStatus(deployments, DeploymentStatus.ROLLED_BACK);
        long terminalDeploymentCount = successDeploymentCount + failedDeploymentCount + rollbackCount;

        return new DeploymentWindowStats(
                deployments.size(),
                countByEnvironment(deployments, DeploymentEnvironment.PRODUCTION),
                successDeploymentCount,
                failedDeploymentCount,
                rollbackCount,
                calculateSuccessRate(successDeploymentCount, terminalDeploymentCount),
                buildDeploymentTrendByStatus(deployments, startDate, endDate),
                buildStatusStats(deployments),
                buildStatusStatsByEnvironment(deployments)
        );
    }

    private DeploymentSeriesTrendResponse buildDeploymentTrendByStatus(
            List<Deployment> deployments, LocalDate startDate, LocalDate endDate) {
        Map<LocalDate, Map<String, Long>> countByDate = new HashMap<>();
        for (Deployment deployment : deployments) {
            LocalDate date = deployment.getDeployedAt().toLocalDate();
            countByDate.computeIfAbsent(date, key -> new HashMap<>())
                    .merge(toTrendBucket(deployment.getStatus()), 1L, Long::sum);
        }

        List<Map<String, Object>> points = startDate.datesUntil(endDate.plusDays(1))
                .map(date -> {
                    Map<String, Object> point = new LinkedHashMap<>();
                    point.put("date", date);
                    Map<String, Long> dayCounts = countByDate.getOrDefault(date, Map.of());
                    for (String bucket : TREND_SERIES) {
                        point.put(bucket, dayCounts.getOrDefault(bucket, 0L));
                    }
                    return point;
                })
                .toList();

        return new DeploymentSeriesTrendResponse(TREND_SERIES, points);
    }

    private String toTrendBucket(DeploymentStatus status) {
        if (TREND_SUCCESS_STATUSES.contains(status)) {
            return "SUCCESS";
        }
        if (TREND_FAILED_STATUSES.contains(status)) {
            return "FAILED";
        }
        if (TREND_RUNNING_STATUSES.contains(status)) {
            return "RUNNING";
        }
        throw new IllegalStateException("추이 버킷 매핑이 정의되지 않은 상태: " + status);
    }

    private List<EnvironmentStatusStatsResponse> buildStatusStatsByEnvironment(List<Deployment> deployments) {
        Map<DeploymentEnvironment, Map<DeploymentStatus, Long>> countsByEnvironment =
                new EnumMap<>(DeploymentEnvironment.class);
        for (DeploymentEnvironment environment : DeploymentEnvironment.values()) {
            countsByEnvironment.put(environment, zeroStatusCounts());
        }
        deployments.forEach(deployment ->
                countsByEnvironment.get(deployment.getEnvironment()).merge(deployment.getStatus(), 1L, Long::sum));

        return Arrays.stream(DeploymentEnvironment.values())
                .map(environment -> {
                    List<StatusStatResponse> statusStats = countsByEnvironment.get(environment).entrySet().stream()
                            .map(entry -> new StatusStatResponse(entry.getKey(), entry.getValue()))
                            .toList();
                    return new EnvironmentStatusStatsResponse(environment, statusStats);
                })
                .toList();
    }

    private List<StatusStatResponse> buildStatusStats(List<Deployment> deployments) {
        Map<DeploymentStatus, Long> counts = zeroStatusCounts();
        deployments.forEach(deployment -> counts.merge(deployment.getStatus(), 1L, Long::sum));

        return counts.entrySet()
                .stream()
                .map(entry -> new StatusStatResponse(entry.getKey(), entry.getValue()))
                .toList();
    }

    private Map<DeploymentStatus, Long> zeroStatusCounts() {
        Map<DeploymentStatus, Long> counts = new EnumMap<>(DeploymentStatus.class);
        for (DeploymentStatus status : DeploymentStatus.values()) {
            counts.put(status, 0L);
        }
        return counts;
    }

    private long countByEnvironment(List<Deployment> deployments, DeploymentEnvironment environment) {
        return deployments.stream()
                .filter(deployment -> deployment.getEnvironment() == environment)
                .count();
    }

    private long countByStatus(List<Deployment> deployments, DeploymentStatus status) {
        return deployments.stream()
                .filter(deployment -> deployment.getStatus() == status)
                .count();
    }

    private double calculateSuccessRate(long successDeploymentCount, long totalDeploymentCount) {
        if (totalDeploymentCount == 0) {
            return 0;
        }
        return Math.round((successDeploymentCount * 1000.0) / totalDeploymentCount) / 10.0;
    }

    record DeploymentWindowStats(
            long weeklyDeploymentCount,
            long productionDeploymentCount,
            long successDeploymentCount,
            long failedDeploymentCount,
            long rollbackCount,
            double successRate,
            DeploymentSeriesTrendResponse deploymentTrendByStatus,
            List<StatusStatResponse> statusStats,
            List<EnvironmentStatusStatsResponse> statusStatsByEnvironment
    ) {
    }
}
