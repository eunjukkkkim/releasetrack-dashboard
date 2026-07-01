package com.example.releasetracker.domain.service;

import com.example.releasetracker.domain.deployment.Deployment;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "services")
public class ManagedService {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(length = 100)
    private String owner;

    @Column(length = 500)
    private String repositoryUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ServiceStatus status;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Deployment> deployments = new ArrayList<>();

    protected ManagedService() {
    }

    public ManagedService(String name, String description, String owner, String repositoryUrl, ServiceStatus status) {
        this.name = name;
        this.description = description;
        this.owner = owner;
        this.repositoryUrl = repositoryUrl;
        this.status = status;
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

    /**
     * 부분 업데이트(PATCH) 의미: 인자가 null 이면 "변경하지 않음"으로 해석한다.
     * 알려진 한계 — null 을 보내 nullable 필드(description, repositoryUrl)를 명시적으로 "비우기"는 불가능하다.
     * JsonNullable 등 별도 의존성 도입은 비용 대비 과하다고 판단하여 채택하지 않았다.
     * name, owner 는 등록 시에만 설정되며 수정 경로에서는 편집 대상이 아니다.
     */
    public void update(String description, String repositoryUrl, ServiceStatus status) {
        if (description != null) {
            this.description = description;
        }
        if (repositoryUrl != null) {
            this.repositoryUrl = repositoryUrl;
        }
        if (status != null) {
            this.status = status;
        }
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getOwner() {
        return owner;
    }

    public String getRepositoryUrl() {
        return repositoryUrl;
    }

    public ServiceStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
