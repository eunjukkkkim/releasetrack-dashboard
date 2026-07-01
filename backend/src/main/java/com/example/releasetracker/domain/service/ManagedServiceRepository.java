package com.example.releasetracker.domain.service;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ManagedServiceRepository extends JpaRepository<ManagedService, Long> {

    @Query("""
            select s
            from ManagedService s
            where (:status is null or s.status = :status)
              and (:keyword is null or lower(s.name) like lower(concat('%', :keyword, '%')))
            order by s.name asc
            """)
    List<ManagedService> search(@Param("status") ServiceStatus status, @Param("keyword") String keyword);

    long countByStatus(ServiceStatus status);
}
