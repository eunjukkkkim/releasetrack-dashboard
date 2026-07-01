package com.example.releasetracker.domain.dashboard.dto;

import java.util.List;
import java.util.Map;

public record DeploymentSeriesTrendResponse(
        List<String> series,
        List<Map<String, Object>> points
) {
}
