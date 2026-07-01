package com.example.releasetracker.domain.deployment.dto;

import com.example.releasetracker.domain.deployment.Deployment;
import com.example.releasetracker.domain.deployment.DeploymentEnvironment;
import com.example.releasetracker.domain.deployment.DeploymentStatus;
import java.time.LocalDateTime;
import java.util.List;

public record DeploymentResponse(
        Long id,
        Long serviceId,
        String serviceName,
        String version,
        DeploymentEnvironment environment,
        DeploymentStatus status,
        String deployedBy,
        LocalDateTime deployedAt,
        LocalDateTime startedAt,
        LocalDateTime finishedAt,
        Long durationSec,
        String commit,
        String branch,
        String summary,
        String failureReason,
        boolean rollbacked,
        List<DeploymentChangeResponse> changes,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static DeploymentResponse from(Deployment deployment) {
        return new DeploymentResponse(
                deployment.getId(),
                deployment.getService().getId(),
                deployment.getService().getName(),
                deployment.getVersion(),
                deployment.getEnvironment(),
                deployment.getStatus(),
                deployment.getDeployedBy(),
                deployment.getDeployedAt(),
                deployment.getStartedAt(),
                deployment.getFinishedAt(),
                deployment.getDurationSec(),
                deployment.getCommit(),
                deployment.getBranch(),
                deployment.getSummary(),
                deployment.getFailureReason(),
                deployment.isRollbacked(),
                deployment.getChanges().stream().map(DeploymentChangeResponse::from).toList(),
                deployment.getCreatedAt(),
                deployment.getUpdatedAt()
        );
    }
}
