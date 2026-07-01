package com.example.releasetracker.domain.deployment;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DeploymentChangeRepository extends JpaRepository<DeploymentChange, Long> {
}
