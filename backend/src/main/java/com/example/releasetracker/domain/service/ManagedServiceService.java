package com.example.releasetracker.domain.service;

import com.example.releasetracker.domain.deployment.Deployment;
import com.example.releasetracker.domain.deployment.DeploymentRepository;
import com.example.releasetracker.domain.service.dto.ServiceCreateRequest;
import com.example.releasetracker.domain.service.dto.ServiceResponse;
import com.example.releasetracker.domain.service.dto.ServiceUpdateRequest;
import com.example.releasetracker.global.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ManagedServiceService {

    private final ManagedServiceRepository serviceRepository;
    private final DeploymentRepository deploymentRepository;

    public ManagedServiceService(ManagedServiceRepository serviceRepository, DeploymentRepository deploymentRepository) {
        this.serviceRepository = serviceRepository;
        this.deploymentRepository = deploymentRepository;
    }

    public List<ServiceResponse> getServices(ServiceStatus status, String keyword) {
        // 서비스별 마지막 배포를 단일 쿼리로 한 번에 조회해 행마다의 N+1 을 제거한다.
        Map<Long, Deployment> lastDeploymentByServiceId = deploymentRepository.findLatestDeploymentByServiceId();
        return serviceRepository.search(status, normalizeKeyword(keyword))
                .stream()
                .map(service -> toResponse(service, lastDeploymentByServiceId.get(service.getId())))
                .toList();
    }

    public ServiceResponse getService(Long serviceId) {
        return toResponse(findService(serviceId));
    }

    @Transactional
    public ServiceResponse createService(ServiceCreateRequest request) {
        ManagedService service = new ManagedService(
                request.name(),
                request.description(),
                request.owner(),
                request.repositoryUrl(),
                request.status()
        );
        return toResponse(serviceRepository.save(service));
    }

    @Transactional
    public ServiceResponse updateService(Long serviceId, ServiceUpdateRequest request) {
        ManagedService service = findService(serviceId);
        service.update(
                request.description(),
                request.repositoryUrl(),
                request.status()
        );
        return toResponse(service);
    }

    @Transactional
    public void deleteService(Long serviceId) {
        ManagedService service = findService(serviceId);
        if (deploymentRepository.existsByServiceId(serviceId)) {
            throw new IllegalArgumentException("배포 이력이 있는 서비스는 삭제할 수 없습니다. 아카이브를 사용하세요. serviceId=" + serviceId);
        }
        serviceRepository.delete(service);
    }

    private ManagedService findService(Long serviceId) {
        return serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("서비스를 찾을 수 없습니다. serviceId=" + serviceId));
    }

    private ServiceResponse toResponse(ManagedService service) {
        // 단건 경로도 목록(findLatestDeploymentByServiceId)과 동일한 deployedAt desc, id desc 정렬을 공유해
        // deployedAt 동률 시에도 목록/상세가 항상 같은 lastDeployment 를 가리키게 한다.
        return toResponse(service, deploymentRepository.findFirstByServiceIdOrderByDeployedAtDescIdDesc(service.getId()).orElse(null));
    }

    private ServiceResponse toResponse(ManagedService service, Deployment lastDeployment) {
        if (lastDeployment == null) {
            return ServiceResponse.from(service, null, null);
        }
        return ServiceResponse.from(service, lastDeployment.getVersion(), lastDeployment.getDeployedAt());
    }

    private String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        return keyword.trim();
    }
}
