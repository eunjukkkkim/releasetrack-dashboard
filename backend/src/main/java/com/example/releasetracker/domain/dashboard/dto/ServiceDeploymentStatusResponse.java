package com.example.releasetracker.domain.dashboard.dto;

import com.example.releasetracker.domain.deployment.Deployment;
import com.example.releasetracker.domain.deployment.DeploymentEnvironment;
import com.example.releasetracker.domain.deployment.DeploymentStatus;
import com.example.releasetracker.domain.service.ManagedService;
import com.example.releasetracker.domain.service.ServiceStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public record ServiceDeploymentStatusResponse(
        Long serviceId,
        String serviceName,
        ServiceStatus serviceStatus,
        String owner,
        String lastDeploymentVersion,
        DeploymentEnvironment lastDeploymentEnvironment,
        DeploymentStatus lastDeploymentStatus,
        LocalDateTime lastDeployedAt,
        Long daysSinceLastDeployment
) {

    public static ServiceDeploymentStatusResponse from(ManagedService service, Deployment lastDeployment, LocalDate today) {
        return new ServiceDeploymentStatusResponse(
                service.getId(),
                service.getName(),
                service.getStatus(),
                service.getOwner(),
                lastDeployment == null ? null : lastDeployment.getVersion(),
                lastDeployment == null ? null : lastDeployment.getEnvironment(),
                lastDeployment == null ? null : lastDeployment.getStatus(),
                lastDeployment == null ? null : lastDeployment.getDeployedAt(),
                // nullable 계약: lastDeployedAt == null ⟺ daysSinceLastDeployment == null
                lastDeployment == null
                        ? null
                        : ChronoUnit.DAYS.between(lastDeployment.getDeployedAt().toLocalDate(), today)
        );
    }
}
