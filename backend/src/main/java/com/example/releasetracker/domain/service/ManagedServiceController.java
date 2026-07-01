package com.example.releasetracker.domain.service;

import com.example.releasetracker.domain.service.dto.ServiceCreateRequest;
import com.example.releasetracker.domain.service.dto.ServiceResponse;
import com.example.releasetracker.domain.service.dto.ServiceUpdateRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/services")
public class ManagedServiceController {

    private final ManagedServiceService serviceService;

    public ManagedServiceController(ManagedServiceService serviceService) {
        this.serviceService = serviceService;
    }

    @GetMapping
    public ResponseEntity<List<ServiceResponse>> getServices(
            @RequestParam(required = false) ServiceStatus status,
            @RequestParam(required = false) String keyword
    ) {
        return ResponseEntity.ok(serviceService.getServices(status, keyword));
    }

    @PostMapping
    public ResponseEntity<ServiceResponse> createService(@Valid @RequestBody ServiceCreateRequest request) {
        ServiceResponse response = serviceService.createService(request);
        return ResponseEntity.created(URI.create("/api/services/" + response.id())).body(response);
    }

    @GetMapping("/{serviceId}")
    public ResponseEntity<ServiceResponse> getService(@PathVariable Long serviceId) {
        return ResponseEntity.ok(serviceService.getService(serviceId));
    }

    @PatchMapping("/{serviceId}")
    public ResponseEntity<ServiceResponse> updateService(
            @PathVariable Long serviceId,
            @Valid @RequestBody ServiceUpdateRequest request
    ) {
        return ResponseEntity.ok(serviceService.updateService(serviceId, request));
    }

    @DeleteMapping("/{serviceId}")
    public ResponseEntity<Void> deleteService(@PathVariable Long serviceId) {
        serviceService.deleteService(serviceId);
        return ResponseEntity.noContent().build();
    }
}
