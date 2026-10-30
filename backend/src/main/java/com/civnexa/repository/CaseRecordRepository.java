package com.civnexa.repository;

import com.civnexa.entity.CaseRecord;
import com.civnexa.entity.Department;
import com.civnexa.entity.User;
import com.civnexa.entity.enums.CaseCategory;
import com.civnexa.entity.enums.CaseStatus;
import com.civnexa.entity.enums.CaseType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaseRecordRepository extends JpaRepository<CaseRecord, Long> {

    Optional<CaseRecord> findByCaseNumber(String caseNumber);

    List<CaseRecord> findByStatus(CaseStatus status);

    List<CaseRecord> findByCaseType(CaseType caseType);

    List<CaseRecord> findByStudent(User student);

    List<CaseRecord> findByReporter(User reporter);

    List<CaseRecord> findByAssignedTo(User assignedTo);

    List<CaseRecord> findByDepartment(Department department);

    Page<CaseRecord> findByStatus(CaseStatus status, Pageable pageable);

    Page<CaseRecord> findByCategory(CaseCategory category, Pageable pageable);

    long countByStatus(CaseStatus status);

    long countByCaseType(CaseType caseType);

    long countByPriority(com.civnexa.entity.enums.Priority priority);

    long countByStatusIn(List<CaseStatus> statuses);

    boolean existsByCaseNumber(String caseNumber);
}
