package com.example.releasetracker.domain.deployment.dto;

import com.example.releasetracker.domain.deployment.ChangeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DeploymentChangeRequest(
        @NotNull(message = "변경 유형은 필수입니다.")
        ChangeType changeType,

        @NotBlank(message = "변경 내용은 필수입니다.")
        String description
) {
}
