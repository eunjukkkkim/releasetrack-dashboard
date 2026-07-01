package com.example.releasetracker.domain.deployment.dto;

import com.example.releasetracker.domain.deployment.Deployment;
import com.example.releasetracker.domain.deployment.DeploymentEnvironment;
import com.example.releasetracker.domain.deployment.DeploymentStatus;
import java.time.LocalDateTime;

public record DeploymentListResponse(
        Long id,
        Long serviceId,
        String serviceName,
        String version,
        DeploymentEnvironment environment,
        DeploymentStatus status,
        String deployedBy,
        LocalDateTime deployedAt,
        String branch,
        String summary,
        boolean rollbacked
) {

    public static DeploymentListResponse from(Deployment deployment) {
        return new DeploymentListResponse(
                deployment.getId(),
                deployment.getService().getId(),
                deployment.getService().getName(),
                deployment.getVersion(),
                deployment.getEnvironment(),
                deployment.getStatus(),
                deployment.getDeployedBy(),
                deployment.getDeployedAt(),
                deployment.getBranch(),
                deployment.getSummary(),
                deployment.isRollbacked()
        );
    }
}
