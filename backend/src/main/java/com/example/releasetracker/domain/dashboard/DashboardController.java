package com.example.releasetracker.domain.dashboard;

import com.example.releasetracker.domain.dashboard.dto.DashboardSummaryResponse;
import com.example.releasetracker.domain.dashboard.dto.ServicePipelineStageResponse;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }

    @GetMapping("/pipeline")
    public ResponseEntity<List<ServicePipelineStageResponse>> getServicePipeline(@RequestParam Long serviceId) {
        return ResponseEntity.ok(dashboardService.getServicePipeline(serviceId));
    }
}
