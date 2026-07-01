package com.example.releasetracker.domain.service.dto;

import com.example.releasetracker.domain.service.ManagedService;
import com.example.releasetracker.domain.service.ServiceStatus;
import java.time.LocalDateTime;

public record ServiceResponse(
        Long id,
        String name,
        String description,
        String owner,
        String repositoryUrl,
        ServiceStatus status,
        String lastDeploymentVersion,
        LocalDateTime lastDeployedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    public static ServiceResponse from(ManagedService service, String lastDeploymentVersion, LocalDateTime lastDeployedAt) {
        return new ServiceResponse(
                service.getId(),
                service.getName(),
                service.getDescription(),
                service.getOwner(),
                service.getRepositoryUrl(),
                service.getStatus(),
                lastDeploymentVersion,
                lastDeployedAt,
                service.getCreatedAt(),
                service.getUpdatedAt()
        );
    }
}
