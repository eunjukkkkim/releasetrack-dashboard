package com.example.releasetracker.domain.deployment;

import com.example.releasetracker.domain.deployment.dto.DeploymentCreateRequest;
import com.example.releasetracker.domain.deployment.dto.DeploymentListResponse;
import com.example.releasetracker.domain.deployment.dto.DeploymentResponse;
import com.example.releasetracker.domain.deployment.dto.DeploymentUpdateRequest;
import com.example.releasetracker.global.dto.PageResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/deployments")
public class DeploymentController {

    private final DeploymentService deploymentService;

    public DeploymentController(DeploymentService deploymentService) {
        this.deploymentService = deploymentService;
    }

    private static final int MAX_PAGE_SIZE = 100;

    @GetMapping
    public ResponseEntity<PageResponse<DeploymentListResponse>> getDeployments(
            @RequestParam(required = false) Long serviceId,
            @RequestParam(required = false) DeploymentEnvironment environment,
            @RequestParam(required = false) DeploymentStatus status,
            @RequestParam(required = false) String branch,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        if (page < 0) {
            throw new IllegalArgumentException("page는 0 이상이어야 합니다.");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("size는 1 이상 " + MAX_PAGE_SIZE + " 이하여야 합니다.");
        }
        return ResponseEntity.ok(
                deploymentService.getDeployments(serviceId, environment, status, branch, from, to, page, size));
    }

    @PostMapping
    public ResponseEntity<DeploymentResponse> createDeployment(@Valid @RequestBody DeploymentCreateRequest request) {
        DeploymentResponse response = deploymentService.createDeployment(request);
        return ResponseEntity.created(URI.create("/api/deployments/" + response.id())).body(response);
    }

    @GetMapping("/{deploymentId}")
    public ResponseEntity<DeploymentResponse> getDeployment(@PathVariable Long deploymentId) {
        return ResponseEntity.ok(deploymentService.getDeployment(deploymentId));
    }

    @PatchMapping("/{deploymentId}")
    public ResponseEntity<DeploymentResponse> updateDeployment(
            @PathVariable Long deploymentId,
            @Valid @RequestBody DeploymentUpdateRequest request
    ) {
        return ResponseEntity.ok(deploymentService.updateDeployment(deploymentId, request));
    }

    @DeleteMapping("/{deploymentId}")
    public ResponseEntity<Void> deleteDeployment(@PathVariable Long deploymentId) {
        deploymentService.deleteDeployment(deploymentId);
        return ResponseEntity.noContent().build();
    }
}
