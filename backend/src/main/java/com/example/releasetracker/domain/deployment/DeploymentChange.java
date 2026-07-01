package com.example.releasetracker.domain.deployment;

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
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "deployment_changes")
public class DeploymentChange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deployment_id", nullable = false)
    private Deployment deployment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ChangeType changeType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    protected DeploymentChange() {
    }

    public DeploymentChange(ChangeType changeType, String description) {
        this.changeType = changeType;
        this.description = description;
    }

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    void assignDeployment(Deployment deployment) {
        this.deployment = deployment;
    }

    public Long getId() {
        return id;
    }

    public ChangeType getChangeType() {
        return changeType;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
