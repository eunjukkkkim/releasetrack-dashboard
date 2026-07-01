package com.example.releasetracker.domain.deployment.dto;

import com.example.releasetracker.domain.deployment.DeploymentEnvironment;
import com.example.releasetracker.domain.deployment.DeploymentStatus;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record DeploymentUpdateRequest(
        DeploymentEnvironment environment,
        DeploymentStatus status,

        LocalDateTime startedAt,

        LocalDateTime finishedAt,

        @Size(max = 100, message = "커밋 SHA는 100자 이하로 입력해주세요.")
        String commit,

        @Size(max = 200, message = "브랜치명은 200자 이하로 입력해주세요.")
        String branch,

        @Size(max = 500, message = "배포 요약은 500자 이하로 입력해주세요.")
        String summary,

        String failureReason,
        Boolean rollbacked
) {
}
