package com.example.releasetracker.domain.dashboard.dto;

import com.example.releasetracker.domain.deployment.Deployment;
import com.example.releasetracker.domain.deployment.DeploymentEnvironment;
import com.example.releasetracker.domain.deployment.DeploymentStatus;
import java.time.LocalDateTime;

public record RecentFailedDeploymentResponse(
        Long id,
        String serviceName,
        String version,
        DeploymentEnvironment environment,
        DeploymentStatus status,
        String deployedBy,
        LocalDateTime deployedAt,
        String failureReason,
        boolean rollbacked
) {

    public static RecentFailedDeploymentResponse from(Deployment deployment) {
        return new RecentFailedDeploymentResponse(
                deployment.getId(),
                deployment.getService().getName(),
                deployment.getVersion(),
                deployment.getEnvironment(),
                deployment.getStatus(),
                deployment.getDeployedBy(),
                deployment.getDeployedAt(),
                deployment.getFailureReason(),
                deployment.isRollbacked()
        );
    }
}
