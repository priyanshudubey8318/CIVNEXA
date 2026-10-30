package com.civnexa.repository;

import com.civnexa.entity.ImportJob;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.ImportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ImportJobRepository extends JpaRepository<ImportJob, Long> {

    Optional<ImportJob> findByJobReference(String jobReference);

    List<ImportJob> findByStatus(ImportStatus status);

    List<ImportJob> findByInitiatedBy(User initiatedBy);

    Page<ImportJob> findAllByOrderByCreatedAtDesc(Pageable pageable);

    boolean existsByJobReference(String jobReference);

    long countByStatus(ImportStatus status);
}
