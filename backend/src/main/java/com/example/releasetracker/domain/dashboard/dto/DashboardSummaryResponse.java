package com.example.releasetracker.domain.dashboard.dto;

import java.util.List;

public record DashboardSummaryResponse(
        long totalServiceCount,
        long activeServiceCount,
        long weeklyDeploymentCount,
        long productionDeploymentCount,
        long successDeploymentCount,
        long failedDeploymentCount,
        long rollbackCount,
        double successRate,
        DeploymentSeriesTrendResponse deploymentTrendByStatus,
        List<StatusStatResponse> statusStats,
        List<EnvironmentStatusStatsResponse> statusStatsByEnvironment,
        List<RecentFailedDeploymentResponse> recentFailedDeployments,
        List<ServiceDeploymentStatusResponse> serviceDeploymentStatuses,
        List<RecentDeploymentResponse> recentDeployments,
        List<TopDeployedServiceResponse> topDeployedServices
) {
}
