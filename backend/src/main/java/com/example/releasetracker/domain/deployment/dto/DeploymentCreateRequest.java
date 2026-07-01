package com.example.releasetracker.domain.deployment.dto;

import com.example.releasetracker.domain.deployment.DeploymentEnvironment;
import com.example.releasetracker.domain.deployment.DeploymentStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

public record DeploymentCreateRequest(
        @NotNull(message = "서비스 ID는 필수입니다.")
        Long serviceId,

        @NotBlank(message = "배포 버전은 필수입니다.")
        @Size(max = 50, message = "배포 버전은 50자 이하로 입력해주세요.")
        String version,

        @NotNull(message = "배포 환경은 필수입니다.")
        DeploymentEnvironment environment,

        @NotNull(message = "배포 상태는 필수입니다.")
        DeploymentStatus status,

        @NotBlank(message = "배포자는 필수입니다.")
        @Size(max = 100, message = "배포자는 100자 이하로 입력해주세요.")
        String deployedBy,

        @NotNull(message = "배포 일시는 필수입니다.")
        LocalDateTime deployedAt,

        LocalDateTime startedAt,

        LocalDateTime finishedAt,

        @Size(max = 100, message = "커밋 SHA는 100자 이하로 입력해주세요.")
        String commit,

        @Size(max = 200, message = "브랜치명은 200자 이하로 입력해주세요.")
        String branch,

        @Size(max = 500, message = "배포 요약은 500자 이하로 입력해주세요.")
        String summary,

        String failureReason,

        Boolean rollbacked,

        @Valid
        List<DeploymentChangeRequest> changes
) {
}
