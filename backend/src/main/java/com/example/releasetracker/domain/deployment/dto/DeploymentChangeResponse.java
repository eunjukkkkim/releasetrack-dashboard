package com.example.releasetracker.domain.deployment.dto;

import com.example.releasetracker.domain.deployment.ChangeType;
import com.example.releasetracker.domain.deployment.DeploymentChange;

public record DeploymentChangeResponse(
        Long id,
        ChangeType changeType,
        String description
) {

    public static DeploymentChangeResponse from(DeploymentChange change) {
        return new DeploymentChangeResponse(
                change.getId(),
                change.getChangeType(),
                change.getDescription()
        );
    }
}
