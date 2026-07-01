package com.example.releasetracker.domain.deployment;

import com.example.releasetracker.domain.deployment.dto.DeploymentChangeRequest;
import com.example.releasetracker.domain.deployment.dto.DeploymentCreateRequest;
import com.example.releasetracker.domain.deployment.dto.DeploymentListResponse;
import com.example.releasetracker.domain.deployment.dto.DeploymentResponse;
import com.example.releasetracker.domain.deployment.dto.DeploymentUpdateRequest;
import com.example.releasetracker.domain.service.ManagedService;
import com.example.releasetracker.domain.service.ManagedServiceRepository;
import com.example.releasetracker.domain.service.ServiceStatus;
import com.example.releasetracker.global.dto.PageResponse;
import com.example.releasetracker.global.exception.ResourceNotFoundException;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DeploymentService {

    private final DeploymentRepository deploymentRepository;
    private final ManagedServiceRepository serviceRepository;

    public DeploymentService(DeploymentRepository deploymentRepository, ManagedServiceRepository serviceRepository) {
        this.deploymentRepository = deploymentRepository;
        this.serviceRepository = serviceRepository;
    }

    public PageResponse<DeploymentListResponse> getDeployments(
            Long serviceId,
            DeploymentEnvironment environment,
            DeploymentStatus status,
            String branch,
            LocalDate from,
            LocalDate to,
            int page,
            int size
    ) {
        return PageResponse.from(
                deploymentRepository.findAll(
                                searchSpec(
                                        serviceId,
                                        environment,
                                        status,
                                        branch,
                                        from,
                                        to
                                ),
                                PageRequest.of(page, size, Sort.by(
                                        Sort.Order.desc("deployedAt"),
                                        Sort.Order.desc("id")
                                ))
                        )
                        .map(DeploymentListResponse::from)
        );
    }

    private Specification<Deployment> searchSpec(
            Long serviceId,
            DeploymentEnvironment environment,
            DeploymentStatus status,
            String branch,
            LocalDate from,
            LocalDate to
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (serviceId != null) {
                predicates.add(criteriaBuilder.equal(root.get("service").get("id"), serviceId));
            }
            if (environment != null) {
                predicates.add(criteriaBuilder.equal(root.get("environment"), environment));
            }
            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }
            if (branch != null && !branch.isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("branch"), branch));
            }
            if (from != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("deployedAt"), from.atStartOfDay()));
            }
            if (to != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("deployedAt"), to.atTime(LocalTime.MAX)));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    public DeploymentResponse getDeployment(Long deploymentId) {
        return DeploymentResponse.from(findDeploymentWithDetails(deploymentId));
    }

    @Transactional
    public DeploymentResponse createDeployment(DeploymentCreateRequest request) {
        ManagedService service = serviceRepository.findById(request.serviceId())
                .orElseThrow(() -> new ResourceNotFoundException("서비스를 찾을 수 없습니다. serviceId=" + request.serviceId()));

        if (service.getStatus() == ServiceStatus.ARCHIVED) {
            throw new IllegalArgumentException(
                    "아카이브된 서비스에는 새 배포를 등록할 수 없습니다. serviceId=" + request.serviceId());
        }

        validateTimeRange(request.startedAt(), request.finishedAt());

        Deployment deployment = new Deployment(
                service,
                request.version(),
                request.environment(),
                request.status(),
                request.deployedBy(),
                request.deployedAt(),
                request.startedAt(),
                request.finishedAt(),
                request.commit(),
                request.branch(),
                request.summary(),
                request.failureReason(),
                Boolean.TRUE.equals(request.rollbacked())
        );

        if (request.changes() != null) {
            for (DeploymentChangeRequest changeRequest : request.changes()) {
                deployment.addChange(new DeploymentChange(changeRequest.changeType(), changeRequest.description()));
            }
        }

        Deployment savedDeployment = deploymentRepository.save(deployment);
        return DeploymentResponse.from(savedDeployment);
    }

    @Transactional
    public DeploymentResponse updateDeployment(Long deploymentId, DeploymentUpdateRequest request) {
        Deployment deployment = findDeploymentWithDetails(deploymentId);
        deployment.update(
                request.environment(),
                request.status(),
                request.startedAt(),
                request.finishedAt(),
                request.commit(),
                request.branch(),
                request.summary(),
                request.failureReason(),
                request.rollbacked()
        );
        // PATCH 적용 후 최종 상태(병합된 startedAt/finishedAt)로 시간 정합을 검증한다.
        validateTimeRange(deployment.getStartedAt(), deployment.getFinishedAt());
        return DeploymentResponse.from(deployment);
    }

    /**
     * startedAt/finishedAt 둘 다 존재할 때만 finishedAt >= startedAt 을 강제한다(위반 시 400).
     * 하나라도 null 이면(QUEUED/RUNNING 등) 검증을 건너뛴다(둘 다 optional).
     */
    private void validateTimeRange(java.time.LocalDateTime startedAt, java.time.LocalDateTime finishedAt) {
        if (startedAt != null && finishedAt != null && finishedAt.isBefore(startedAt)) {
            throw new IllegalArgumentException("종료 일시는 시작 일시보다 빠를 수 없습니다.");
        }
    }

    @Transactional
    public void deleteDeployment(Long deploymentId) {
        Deployment deployment = deploymentRepository.findById(deploymentId)
                .orElseThrow(() -> new ResourceNotFoundException("배포 이력을 찾을 수 없습니다. deploymentId=" + deploymentId));
        deploymentRepository.delete(deployment);
    }

    private Deployment findDeploymentWithDetails(Long deploymentId) {
        return deploymentRepository.findWithServiceAndChangesById(deploymentId)
                .orElseThrow(() -> new ResourceNotFoundException("배포 이력을 찾을 수 없습니다. deploymentId=" + deploymentId));
    }
}
