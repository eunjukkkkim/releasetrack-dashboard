package com.example.releasetracker.domain.dashboard.dto;

import com.example.releasetracker.domain.deployment.ServiceDeploymentCount;

public record TopDeployedServiceResponse(
        Long serviceId,
        String serviceName,
        long deploymentCount,
        long successCount,
        long failedCount,
        long inProgressCount
) {

    public static TopDeployedServiceResponse from(ServiceDeploymentCount count) {
        return new TopDeployedServiceResponse(
                count.serviceId(),
                count.serviceName(),
                count.deploymentCount(),
                count.successCount(),
                count.failedCount(),
                count.inProgressCount()
        );
    }
}
