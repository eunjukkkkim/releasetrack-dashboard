package com.example.releasetracker.domain.deployment;

public record ServiceDeploymentCount(
        Long serviceId,
        String serviceName,
        long deploymentCount,
        long successCount,
        long failedCount,
        long inProgressCount
) {
}
