package com.civnexa.repository;

import com.civnexa.entity.AppealRecord;
import com.civnexa.entity.CaseRecord;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.AppealStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppealRecordRepository extends JpaRepository<AppealRecord, Long> {

    Optional<AppealRecord> findByAppealNumber(String appealNumber);

    List<AppealRecord> findByCaseRecord(CaseRecord caseRecord);

    List<AppealRecord> findByAppellant(User appellant);

    List<AppealRecord> findByAssignedReviewer(User assignedReviewer);

    List<AppealRecord> findByStatus(AppealStatus status);

    Page<AppealRecord> findByStatus(AppealStatus status, Pageable pageable);

    boolean existsByAppealNumber(String appealNumber);

    long countByStatus(AppealStatus status);
}
