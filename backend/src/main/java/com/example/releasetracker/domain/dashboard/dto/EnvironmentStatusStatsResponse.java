package com.example.releasetracker.domain.dashboard.dto;

import com.example.releasetracker.domain.deployment.DeploymentEnvironment;
import java.util.List;

/**
 * 환경별 최근 7일 윈도우 배포 상태 분포. 바깥 리스트는 DEV, STAGING, PRODUCTION 고정 순서로 항상 3개,
 * 각 statusStats 는 QUEUED, RUNNING, SUCCESS, FAILED, ROLLED_BACK(enum 선언 순) 고정 5개로 0 채움한다.
 */
public record EnvironmentStatusStatsResponse(
        DeploymentEnvironment environment,
        List<StatusStatResponse> statusStats
) {
}
