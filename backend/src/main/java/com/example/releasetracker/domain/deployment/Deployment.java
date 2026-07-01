package com.example.releasetracker.domain.deployment;

import com.example.releasetracker.domain.service.ManagedService;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "deployments")
public class Deployment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private ManagedService service;

    @Column(nullable = false, length = 50)
    private String version;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeploymentEnvironment environment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private DeploymentStatus status;

    @Column(nullable = false, length = 100)
    private String deployedBy;

    @Column(nullable = false)
    private LocalDateTime deployedAt;

    @Column
    private LocalDateTime startedAt;

    @Column
    private LocalDateTime finishedAt;

    @Column(name = "commit_sha", length = 100)
    private String commit;

    @Column(length = 200)
    private String branch;

    @Column(length = 500)
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String failureReason;

    @Column(nullable = false)
    private boolean rollbacked;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "deployment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DeploymentChange> changes = new ArrayList<>();

    protected Deployment() {
    }

    public Deployment(
            ManagedService service,
            String version,
            DeploymentEnvironment environment,
            DeploymentStatus status,
            String deployedBy,
            LocalDateTime deployedAt,
            LocalDateTime startedAt,
            LocalDateTime finishedAt,
            String commit,
            String branch,
            String summary,
            String failureReason,
            boolean rollbacked
    ) {
        this.service = service;
        this.version = version;
        this.environment = environment;
        this.status = status;
        this.deployedBy = deployedBy;
        this.deployedAt = deployedAt;
        this.startedAt = startedAt;
        this.finishedAt = finishedAt;
        this.commit = commit;
        this.branch = branch;
        this.summary = summary;
        this.failureReason = failureReason;
        this.rollbacked = rollbacked;
    }

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addChange(DeploymentChange change) {
        changes.add(change);
        change.assignDeployment(this);
    }

    /**
     * 부분 업데이트(PATCH) 의미: 인자가 null 이면 "변경하지 않음"으로 해석한다.
     * 알려진 한계 — null 을 보내 nullable 필드(summary, failureReason)를 명시적으로 "비우기"는 불가능하다.
     *  (예: 배포가 복구되어도 과거 failureReason 을 null 로 되돌릴 수 없음.)
     * JsonNullable 등 별도 의존성 도입은 비용 대비 과하다고 판단하여 채택하지 않았다.
     * "비우기"가 필요해지면 명시적 clear 플래그 또는 JsonNullable 도입을 검토한다.
     */
    public void update(
            DeploymentEnvironment environment,
            DeploymentStatus status,
            LocalDateTime startedAt,
            LocalDateTime finishedAt,
            String commit,
            String branch,
            String summary,
            String failureReason,
            Boolean rollbacked
    ) {
        if (environment != null) {
            this.environment = environment;
        }
        if (status != null) {
            this.status = status;
        }
        if (startedAt != null) {
            this.startedAt = startedAt;
        }
        if (finishedAt != null) {
            this.finishedAt = finishedAt;
        }
        if (commit != null) {
            this.commit = commit;
        }
        if (branch != null) {
            this.branch = branch;
        }
        if (summary != null) {
            this.summary = summary;
        }
        if (failureReason != null) {
            this.failureReason = failureReason;
        }
        if (rollbacked != null) {
            this.rollbacked = rollbacked;
        }
    }

    public Long getId() {
        return id;
    }

    public ManagedService getService() {
        return service;
    }

    public String getVersion() {
        return version;
    }

    public DeploymentEnvironment getEnvironment() {
        return environment;
    }

    public DeploymentStatus getStatus() {
        return status;
    }

    public String getDeployedBy() {
        return deployedBy;
    }

    public LocalDateTime getDeployedAt() {
        return deployedAt;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getFinishedAt() {
        return finishedAt;
    }

    /**
     * 배포 소요시간(초). startedAt/finishedAt 둘 다 존재할 때만 (finishedAt - startedAt) 초를 파생한다.
     * 하나라도 null(QUEUED/RUNNING 또는 타이밍 미기록 레거시)이면 null 을 반환한다.
     * 엔티티에 저장하지 않는 read-only 파생 값으로, 응답 DTO 와 대시보드 소요시간 집계가 함께 사용한다.
     */
    public Long getDurationSec() {
        if (startedAt == null || finishedAt == null) {
            return null;
        }
        return ChronoUnit.SECONDS.between(startedAt, finishedAt);
    }

    public String getCommit() {
        return commit;
    }

    public String getBranch() {
        return branch;
    }

    public String getSummary() {
        return summary;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public boolean isRollbacked() {
        return rollbacked;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<DeploymentChange> getChanges() {
        return changes;
    }
}
