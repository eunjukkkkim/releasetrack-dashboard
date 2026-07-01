package com.example.releasetracker.domain.dashboard.dto;

import com.example.releasetracker.domain.deployment.Deployment;
import com.example.releasetracker.domain.deployment.DeploymentEnvironment;
import com.example.releasetracker.domain.deployment.DeploymentStatus;
import java.time.LocalDateTime;

/**
 * 특정 서비스의 환경별 최신 배포 1건(현재 상태 카드). deployedAt desc, id desc 기준 최신.
 * 해당 (서비스×환경)에 배포가 없으면 environment 외 모든 필드는 null 이다(빈 환경 카드).
 * 기존 EnvironmentPipelineResponse 와 shape 은 동일하되, 의미가 "전 서비스 혼재 최신"이 아니라
 * "해당 serviceId 의 환경별 최신"으로 한정되므로 별도 DTO 로 명명해 혼동을 막는다.
 */
public record ServicePipelineStageResponse(
        DeploymentEnvironment environment,
        Long deploymentId,
        String serviceName,
        String version,
        DeploymentStatus status,
        String branch,
        String deployedBy,
        LocalDateTime deployedAt,
        LocalDateTime finishedAt
) {

    public static ServicePipelineStageResponse from(DeploymentEnvironment environment, Deployment deployment) {
        if (deployment == null) {
            return new ServicePipelineStageResponse(environment, null, null, null, null, null, null, null, null);
        }
        return new ServicePipelineStageResponse(
                environment,
                deployment.getId(),
                deployment.getService().getName(),
                deployment.getVersion(),
                deployment.getStatus(),
                deployment.getBranch(),
                deployment.getDeployedBy(),
                deployment.getDeployedAt(),
                deployment.getFinishedAt()
        );
    }
}
