package com.example.releasetracker.domain.dashboard.dto;

import com.example.releasetracker.domain.deployment.DeploymentStatus;

public record StatusStatResponse(
        DeploymentStatus status,
        long count
) {
}
